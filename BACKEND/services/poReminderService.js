const NetworkRecord = require("../models/NetworkRecord");
const AmcRecord = require("../models/AmcRecord");
const ContractRecord = require("../models/ContractRecord");

const sendEmail = require("./emailService");

const poExpiryReminderEmail = require("../templates/poExpiryReminderEmail");

const RECIPIENTS = [
    // "sanchit.jain@jindalstainless.com",
    // "karan.singh@jindalstainless.com"
    "yashkumar9926@gmail.com",
    "y37047614@gmail.com"
];

async function checkNetworkPOReminders() {
    try {
        const records = await NetworkRecord.find({
            renewed: false
        });

        const today = new Date();
        today.setHours(0,0,0,0);

        for (const record of records) { 
            if (!record.poEndDate) {
                continue;
            }

            const endDate = new Date(record.poEndDate);
            endDate.setHours(0,0,0,0);

            if (isNaN(endDate)) {
                continue;
            }

            if (endDate < today) {
                continue;
            }

            const twoMonthsLater = new Date(today);
            twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);

            const oneMonthLater = new Date(today);
            oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

            if (endDate <= twoMonthsLater && endDate > oneMonthLater) {
                try {
                    await sendEmail(
                        RECIPIENTS.join(","),
                        "PO Expiry Reminder - 2 Months Remaining",
                        poExpiryReminderEmail(record, "2_MONTH")
                    );
                }
                catch (emailError) {
                    console.error(emailError);
                }
                
            }


            if (endDate <= oneMonthLater && endDate >= today) {
                try {
                    await sendEmail(
                        RECIPIENTS.join(","),
                        "Urgent: PO Expiry Reminder - 1 Month Remaining",
                        poExpiryReminderEmail(record, "1_MONTH")
                    );
                }
                catch (emailError) {
                    console.error(emailError);
                }
                
            }
        }
    }
    catch(error) {
        console.error("PO Reminder Error:", error);
    }
}



async function checkAmcPOReminders() {
    try {
        const records = await AmcRecord.find({
            renewed: false
        });

        const today = new Date();
        today.setHours(0,0,0,0);

        for (const record of records) {
            if (!record.poEndDate) {
                continue;
            }

            const endDate = new Date(record.poEndDate);
            endDate.setHours(0,0,0,0);

            if (isNaN(endDate)) {
                continue;
            }

            if (endDate < today) {
                continue;
            }

            const twoMonthsLater = new Date(today);
            twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);

            const oneMonthLater = new Date(today);
            oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

            if (endDate <= twoMonthsLater && endDate > oneMonthLater) {
                try {
                    await sendEmail(
                        RECIPIENTS.join(","),
                        "PO Expiry Reminder - 2 Months Remaining",
                        poExpiryReminderEmail(record, "2_MONTH")
                    );
                }
                catch (emailError) {
                    console.error(emailError);
                }
                
            }

            if (endDate <= oneMonthLater && endDate >= today) {
                try {
                    await sendEmail(
                        RECIPIENTS.join(","),
                        "Urgent: PO Expiry Reminder - 1 Month Remaining",
                        poExpiryReminderEmail(record, "1_MONTH")
                    );
                }
                catch (emailError) {
                    console.error(emailError);
                }
                
            }

        }
    }
    catch(error) {
        console.error("PO Reminder Error:", error);
    }
}



async function checkContractPOReminders() {

    try {

        const records = await ContractRecord.find({
            renewed: false
        });

        const today = new Date();
        today.setHours(0,0,0,0);

        for (const record of records) {

            if (!record.poEndDate) {
                continue;
            }

            const endDate = new Date(record.poEndDate);
            endDate.setHours(0,0,0,0);

            if (isNaN(endDate)) {
                continue;
            }

            if (endDate < today) {
                continue;
            }

            const twoMonthsLater = new Date(today);
            twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);

            const oneMonthLater = new Date(today);
            oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

            if (endDate <= twoMonthsLater && endDate > oneMonthLater) {
                try {
                    await sendEmail(
                        RECIPIENTS.join(","),
                        "PO Expiry Reminder - 2 Months Remaining",
                        poExpiryReminderEmail(record, "2_MONTH")
                    );
                }
                catch (emailError) {
                    console.error(emailError);
                }
                
            }

            if (endDate <= oneMonthLater && endDate >= today) {
                try {
                    await sendEmail(
                        RECIPIENTS.join(","),
                        "Urgent: PO Expiry Reminder - 1 Month Remaining",
                        poExpiryReminderEmail(record, "1_MONTH")
                    );
                }
                catch (emailError) {
                    console.error(emailError);
                }
                
            }

        }
    }
    catch(error) {
        console.error("PO Reminder Error:", error);
    }
}


module.exports = {
    checkNetworkPOReminders,
    checkAmcPOReminders,
    checkContractPOReminders
};