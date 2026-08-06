function createFindQuery(
    collection,
    sort = {},
    limit = 0,
    filter = {},
    responseType = "list"
) {

    return {

        collection,

        type: "find",

        filter,

        sort,

        limit,

        responseType

    };

}


function detectCollection(text) {

    if (text.includes("contract")) return "contract";

    if (text.includes("amc")) return "amc";

    if (
        text.includes("hardware inventory") ||
        text.includes("hardware")
    ) return "inventoryHardware";

    if (text.includes("network inventory"))
        return "inventoryNetwork";

    if (text.includes("network"))
        return "network";

    if (text.includes("plant material"))
        return "plantMaterial";

    if (text.includes("plant service"))
        return "plantService";

    return null;

}

function generateRuleBasedQuery(question) {

    let text = question.toLowerCase().trim();

    text = text
        .replace(/\bmaximum\b/g, "highest")
        .replace(/\blargest\b/g, "highest")
        .replace(/\btop\b/g, "highest")
        .replace(/\bmax\b/g, "highest")

        .replace(/\bminimum\b/g, "lowest")
        .replace(/\bsmallest\b/g, "lowest")
        .replace(/\bleast\b/g, "lowest")
        .replace(/\bmin\b/g, "lowest")

        .replace(/\blist\b/g, "show")
        .replace(/\bdisplay\b/g, "show");

    // -----------------------
    // Detect Collection
    // -----------------------

    const collection = detectCollection(text);

    if (!collection) {
        return null;
    }

    // -----------------------
    // Highest Amount
    // -----------------------

    if (
        text.includes("highest") &&
        (
            text.includes("amount") ||
            text.includes("contract") ||
            text.includes("amc")
        )
    ) {

        return createFindQuery(
            collection,
            { poAmount: -1 },
            1,
            {},
            "highestAmount"
        );

    }

    // -----------------------
    // Lowest Amount
    // -----------------------

    if (
        text.includes("lowest") &&
        (
            text.includes("amount") ||
            text.includes("contract") ||
            text.includes("amc")
        )
    ) {

        return createFindQuery(
            collection,
            { poAmount: 1 },
            1,
            {},
            "lowestAmount"
        );

    }

    // -----------------------
    // Highest Balance
    // -----------------------

    if (
        text.includes("highest") &&
        text.includes("balance")
    ) {

        return createFindQuery(
            collection,
            { balanceAmount: -1 },
            1,
            {},
            "highestBalance"
        );

    }

    // -----------------------
    // Lowest Balance
    // -----------------------

    if (
        text.includes("lowest") &&
        text.includes("balance")
    ) {

        return createFindQuery(
            collection,
            { balanceAmount: 1 },
            1,
            {},
            "lowestBalance"
        );

    }


    if (
        text.includes("total") &&
        text.includes("amount")
    ) {
    
        return createFindQuery(
            collection,
            {},
            0,
            {},
            "totalAmount"
        );
    
    }


    if (
        text.includes("total") &&
        text.includes("balance")
    ) {
    
        return createFindQuery(
            collection,
            {},
            0,
            {},
            "totalBalance"
        );
    
    }


    if (
        text.includes("average") &&
        text.includes("amount")
    ) {
    
        return createFindQuery(
            collection,
            {},
            0,
            {},
            "averageAmount"
        );
    
    }


    if (
        text.includes("count") ||
        text.includes("how many") ||
        text.includes("number of")
    ) {
    
        return createFindQuery(
            collection,
            {},
            0,
            {},
            "count"
        );
    
    }


    if (
        text.includes("not renewed") ||
        text.includes("pending renewal")
    ) {
    
        return createFindQuery(
            collection,
            {},
            0,
            {
                renewed: false
            },
            "list"
        );
    
    }


    if (text.includes("renewed")) {

        return createFindQuery(
            collection,
            {},
            0,
            {
                renewed: true
            },
            "list"
        );
    
    }

    // -----------------------
    // Show All
    // -----------------------

    if (
        text.includes("show") ||
        text.includes("all")
    ) {

        return createFindQuery(
            collection,
            {},
            0,
            {},
            "list"
        );

    }

    // AI Required

    return null;

}

module.exports = {
    generateRuleBasedQuery
};