const emailLayout = require("./emailLayout");


function accountDeletedEmail(name) {
    const content = `
        <p>Hello <strong>${name}</strong>,</p>
        <p>This is to inform you that your account for the <strong>IT Infra Management System</strong> has been removed by the system administrator.</p>
        <br>
        <div style="background:#fdecea; border-left:5px solid #d32f2f; padding:15px; color:#b71c1c;">
            <strong>Account Status:</strong> Deleted
        </div>
        <br>
        <p>You will no longer be able to log in to the system using your previous credentials.</p>
        <br>
        <p>If you believe this action was taken in error, please contact your IT Administrator.</p>
        <br>
        <p>
            Regards,<br>IT Admin
        </p>
    `;

    return emailLayout("Account Deleted", content);
}

module.exports = accountDeletedEmail;