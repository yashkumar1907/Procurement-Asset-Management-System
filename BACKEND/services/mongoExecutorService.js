const { MODELS } = require("./schemaService");

async function executeMongoQuery(query) {
    if (!query) {
        throw new Error("Query object is missing.");
    }

    const Model = MODELS[query.collection];

    if (!Model) {
        throw new Error(`Unknown collection: ${query.collection}`);
    }

    return await Model.find(query.filter ?? {})
        .sort(query.sort ?? {})
        .limit(query.limit ?? 0)
        .lean();

}

module.exports = {
    executeMongoQuery
};