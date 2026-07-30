const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
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