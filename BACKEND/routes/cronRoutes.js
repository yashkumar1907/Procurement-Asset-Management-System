const express = require("express");
const router = express.Router();

const { runPOReminderJob } = require("../services/poReminderService");

router.post("/run-po-reminders", async (req, res) => {

    console.log("Header:", req.headers.authorization);
    console.log("Secret:", process.env.CRON_SECRET);

    if (req.headers.authorization !== process.env.CRON_SECRET) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    try {
        res.status(200).json({
            success: true,
            message: "PO Reminder Job Started"
        });
    
        runPOReminderJob()
            .catch(err => console.error(err));
    
    }
    catch (error) {
    
        console.error(error);
    
        res.status(500).json({
            success: false
        });
    
    }

});

module.exports = router;