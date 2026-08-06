
const { GoogleGenAI } = require("@google/genai");
const MODEL = "gemini-2.5-flash";


const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});


function getResponseText(response) {
    return typeof response.text === "function"
        ? response.text()
        : (response.text || "");
}


function isQuotaError(error) {
    const message = error.message?.toLowerCase() || "";

    return (
        error.status === 429 ||
        error.code === 429 ||
        message.includes("quota") ||
        message.includes("resource_exhausted")
    );
}


async function chatCompletion(prompt) {
    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
            config: {
                temperature: 0
            }
        });

        const content = getResponseText(response);

        return content.replace(/```json/g, "").replace(/```/g, "").trim();
    }
    catch (error) {
        console.error("Gemini query generation error:", error);
    
        if (isQuotaError(error)) {
            throw new Error("AI usage limit reached. Please try again later.");
        }

        throw new Error("Unable to generate MongoDB query.");
    }
}


async function summarize(question, records, analytics) {
    try {
        const systemPrompt = `
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
        `;

        const userPrompt = `
            User Question: ${question}
            Matching Records: ${JSON.stringify(records, null, 2)}
            Analytics: ${JSON.stringify(analytics, null, 2)}
        `;

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.2,
                maxOutputTokens: 700
            }
        });

        const content = getResponseText(response);
        return content || "No response generated.";
    }
    catch (error) {
        console.error("Gemini summarize error:", error);
    
        if (isQuotaError(error)) {
            return "⚠ AI usage limit reached. Please try again later.";
        }
    
        return "⚠ Unable to generate an AI response at the moment.";
    }
}


module.exports = {chatCompletion,summarize};