const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS
    requireTLS: true,

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
        console.log("Attempting to send email to:", to);

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