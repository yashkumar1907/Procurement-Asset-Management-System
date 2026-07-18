const emailLayout = require("./emailLayout");

function permissionUpdatedEmail(name, permissions) {

    const content = `
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your system permissions have been updated by the administrator.</p>
        <br>

        <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse: collapse; border:1px solid #ddd;">
            <tr style="background:#ff6b00; color:white;">
                <th align="left">Module</th>
                <th align="left">Access</th>
            </tr>

            <tr>
                <td>Network & Bandwidth Management</td>
                <td>${permissions.network}</td>
            </tr>

            <tr>
                <td>Annual Maintenance Contract</td>
                <td>${permissions.amc}</td>
            </tr>

            <tr>
                <td>Contract Resource & Support PRs</td>
                <td>${permissions.contract}</td>
            </tr>

            <tr>
                <td>Inventory Network</td>
                <td>${permissions.inventoryNetwork}</td>
            </tr>

            <tr>
                <td>Inventory Hardware</td>
                <td>${permissions.inventoryHardware}</td>
            </tr>

            <tr>
                <td>Inventory Department</td>
                <td>${permissions.inventoryDepartment}</td>
            </tr>

            <tr>
                <td>Plant Material</td>
                <td>${permissions.plantMaterial}</td>
            </tr>

            <tr>
                <td>Plant Service</td>
                <td>${permissions.plantService}</td>
            </tr>

            <tr>
                <td>WBS (Project)</td>
                <td>${permissions.wbsProject}</td>
            </tr>
        </table>

        <br>

        <div style=" background:#fff3cd; border-left:5px solid #ff6b00; padding:15px;">
            If you believe these changes are incorrect, please contact your IT Administrator.
        </div>

        <br>

        Regards,<br>
        IT Admin
    `;

    return emailLayout("Permissions Updated", content);
}

module.exports = permissionUpdatedEmail;