const express = require("express");

const router = express.Router();

const {
    checkNetworkPOReminders,
    checkAmcPOReminders,
    checkContractPOReminders
} = require("../services/poReminderService");


router.get("/run", async (req, res) => {

    if (req.headers.authorization !== `Bearer ${process.env.REMINDER_SECRET}`) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }

    try {

        await checkNetworkPOReminders();
        await checkAmcPOReminders();
        await checkContractPOReminders();

        res.json({
            success: true,
            message: "PO reminder job completed successfully."
        });

    }
    catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "PO reminder job failed."
        });

    }

});

module.exports = router;