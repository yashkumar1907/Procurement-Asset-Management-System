const express = require("express");

const { summarize } = require("../services/groqService");

const { generateMongoQuery } = require("../services/queryGeneratorService");

const { executeMongoQuery } = require("../services/mongoExecutorService");

const {getHighest, getLowest, getTotalAmount, getTotalBalance, getCount, getAverageAmount, getHighestBalance, getExpiringSoon, getLowestBalance} = require("../services/analyticsService");

const router = express.Router();

router.post("/query", async (req, res) => {

    try {

        const { question } = req.body;

        console.log("QUESTION:", question);

        if (!question) {

            return res.status(400).json({
                success: false,
                message: "Question is required."
            });

        }

        const mongoQuery = await generateMongoQuery(question);

        console.log("MONGO QUERY:", mongoQuery);

        console.log(JSON.stringify(mongoQuery, null, 2));

        const records = await executeMongoQuery(mongoQuery);

        if (!Array.isArray(records)) {
            throw new Error("Mongo query must return an array.");
        }

        console.log("RECORDS FOUND:", records.length);

        console.log(
            JSON.stringify(records, null, 2)
        );

        const analytics = {};

        if (mongoQuery.type === "find") {
        
            analytics.totalAmount = getTotalAmount(records);
            analytics.totalBalance = getTotalBalance(records);
            analytics.count = getCount(records);
            analytics.averageAmount = getAverageAmount(records);
            analytics.highestBalance = getHighestBalance(records);
            analytics.highest = getHighest(records);
            analytics.lowest = getLowest(records);
            analytics.lowestBalance = getLowestBalance(records);
        
        }


        analytics.expiringSoon = getExpiringSoon(records, 60);

        
        let aiRecords = [];
        let totalRecords = 0;


        aiRecords = records.map(record => ({

            vendor: record.vendorName ?? record.vendor,
            vendorCode: record.vendorCode,
            description: record.poDescription ?? record.description,
            amount:
                record.poAmount ??
                record.amount ??
                record.totalValue ??
                record.value,
            balance: record.balanceAmount,
            startDate: record.poStartDate ?? record.startDate,
            endDate: record.poEndDate ?? record.endDate,
            renewed: record.renewed
        }));

        totalRecords = records.length;


        if (records.length === 0) {
            return res.json({
                success: true,
                answer: "No matching records found.",
                totalRecords: 0
            });
        }
        

        const answer = await summarize(
            question,
            aiRecords,
            analytics
        );

        res.json({
            success: true,
            answer,
            totalRecords
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });

    }

});

module.exports = router;