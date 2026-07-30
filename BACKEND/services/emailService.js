const nodemailer = require("nodemailer");

console.log(process.env.EMAIL_USER);
console.log(process.env.EMAIL_PASS ? "PASS FOUND" : "PASS NOT FOUND");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    family: 4,

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error("SMTP Verify Error:", error);
    } else {
        console.log("SMTP Server Ready");
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