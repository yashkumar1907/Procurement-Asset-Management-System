const { chatCompletion } = require("./groqService");

const {
    getSchemaDescription,
    VALID_COLLECTIONS
} = require("./schemaService");

async function generateMongoQuery(question) {

    const schema = getSchemaDescription();

    const prompt = `
You are an AI that converts natural language into MongoDB find queries.

Database Schema:

${schema}

Rules:

1. Return ONLY valid JSON.
2. Never explain.
3. Never use markdown.
4. Always generate a FIND query.
5. Select the correct collection.
6. Select the correct fields.
7. Use MongoDB regex for text search.
8. Use sort whenever highest/lowest is requested.
9. Use limit:1 if only one record is needed.
10. Use limit:0 if all matching records are needed.
11. Never generate aggregate queries.
12. Never generate update/delete queries.
13. If the question is ambiguous, choose the most relevant collection.
14. Never invent field names.
15. Use only fields from the schema.

Output Format:

{
    "collection":"",
    "type":"find",
    "filter":{},
    "sort":{},
    "limit":0
}

Question:

${question}
`;

    const response = await chatCompletion(prompt);

    try {

        const query = JSON.parse(response.trim());
        
        if (!VALID_COLLECTIONS.includes(query.collection)) {
            query.collection = "contract";
        }
        
        query.type = "find";
        
        query.filter ??= {};
        query.sort ??= {};
        query.limit ??= 0;
        
        return query;
    
    }
    catch (error) {
    
        console.error("Invalid AI JSON received from Groq.");
        console.error("Question:", question);
        console.error("Response:", response);
        console.error(error);
    
        return {
    
            collection: "contract",
    
            type: "find",
    
            filter: {},
    
            sort: {},
    
            limit: 0
    
        };
    
    }

}

module.exports = {
    generateMongoQuery
};