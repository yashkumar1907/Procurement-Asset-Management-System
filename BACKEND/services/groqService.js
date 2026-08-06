const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

async function chatCompletion(prompt) {

    try {

        const completion = await groq.chat.completions.create({

            model: "llama-3.3-70b-versatile",

            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],

            temperature: 0

        });

        const content = completion.choices[0].message.content ?? "";

        return content
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

    }
    catch (error) {

        console.error("Groq query generation error:", error);
    
        if (error.status === 429) {
    
            throw new Error(
                "AI usage limit reached. Please try again later."
            );
    
        }
    
        throw new Error(
            "Unable to generate MongoDB query."
        );
    
    }

}


async function summarize(question, records, analytics) {

    

    try {

        const completion = await groq.chat.completions.create({

                    model: "llama-3.3-70b-versatile",
            
                    messages: [
            
                        {
                            role: "system",
                            content: `
            You are the AI assistant for the JSL Enterprise Management System.
            
            The database has already been queried.
            
            You will receive:
            
            1. User question
            2. Matching database records
            3. Precomputed analytics
            
            Rules:
            
            - Answer ONLY using the supplied data.
            - Never invent vendors, PO numbers, values or dates.
            - If there are no matching records, clearly say so.
            - Prefer analytics whenever available instead of recalculating.
            - If the user asks for a list, present it using bullet points.
            - Mention vendor names, descriptions, amounts, balances and dates whenever relevant.
            - If only one record matches, answer naturally instead of listing.
            - Keep answers concise.
            - Maximum 8 short paragraphs.
            - Maximum 10 bullet points.
            - Use Indian number formatting when mentioning currency.
            - Never output JSON.
            - Never explain your reasoning.
            - If numeric analytics are provided, trust them instead of recalculating from records.
            `
                        },
            
                        {
                            role: "user",
                            content: `
            User Question:
            
            ${question}
            
            Matching Records:
            
            ${JSON.stringify(records)}
            
            Analytics:
            
            ${JSON.stringify(analytics)}
            `
                        }
            
                    ],
            
                    temperature: 0.2,
            
                    max_completion_tokens: 700
            
                
            
                });

                return completion.choices[0].message.content?.trim() ||
                "No response generated.";
    
    }
    catch (error) {

        console.error("Groq summarize error:", error);
    
        if (error.status === 429) {
    
            return "⚠ AI usage limit reached. Please try again later.";
    
        }
    
        return "⚠ Unable to generate an AI response at the moment.";
    
    }

}



module.exports = {
    chatCompletion,
    summarize
};