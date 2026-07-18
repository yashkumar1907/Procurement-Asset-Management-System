const emailLayout = require("./emailLayout");

function welcomeEmail(name, email, password) {
    const content = `
        <p>Your account has been created successfully.</p>
        <hr>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${password}</p>
        <br>
        <p>You can now login to the <strong>IT Infra Management System</strong>.</p>
        <br>
        <p style="color:red;">
            Please change your password immediately after your first login.
        </p>
        <br>
        <p>
            Regards,<br>
            IT Admin
        </p>
    `;

    return emailLayout(`Welcome ${name}!`, content);
}

module.exports = welcomeEmail;