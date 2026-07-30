const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


// ===============================
// SEND EMAIL
// ===============================
async function sendEmail(to, subject, html) {
    try {
        console.log("Inside sendEmail");
        console.log("EMAIL_USER:", process.env.EMAIL_USER);
        console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
        
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            html
        });

        console.log("Email Sent Successfully");
    }
    catch (error) {
        console.error("Email Error:", error);
        throw error;
    }
}

module.exports = sendEmail;