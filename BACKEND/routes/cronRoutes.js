const express = require("express");
const router = express.Router();

const { runPOReminderJob } = require("../services/poReminderService");

router.post("/run-po-reminders", async (req, res) => {

    if (req.headers.authorization !== process.env.CRON_SECRET) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    try {
        await runPOReminderJob();

        res.status(200).json({
            success: true,
            message: "PO Reminder Job Executed Successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }

});

module.exports = router;