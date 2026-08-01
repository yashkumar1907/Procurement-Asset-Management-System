function emailLayout(title, content) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
        </head>

        <body style=" margin:0; padding:30px; background:#f5f5f5; font-family:Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td align="center">
                        <table width="650" cellpadding="0" cellspacing="0" style=" background:white; border-radius:12px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,.1);">

                            <!-- HEADER -->
                            <tr>
                                <td style=" background:#ff6b00; color:white; padding:25px; text-align:center;">
                                    <h1 style="margin:0;">
                                        IT Infra Management System
                                    </h1>

                                    <p style="margin-top:8px;">
                                        Jindal Stainless Limited
                                    </p>
                                </td>
                            </tr>

                            <!-- TITLE -->
                            <tr>
                                <td style=" padding:30px 35px 10px;">
                                    <h2 style="color:#ff6b00; margin:0;">
                                        ${title}
                                    </h2>
                                </td>
                            </tr>

                            <!-- CONTENT -->
                            <tr>
                                <td style=" padding:20px 35px; color:#444; line-height:1.8;">
                                    ${content}
                                </td>
                            </tr>

                            <!-- FOOTER -->
                            <tr>
                                <td style="background:#f2f2f2; text-align:center; padding:20px; color:#666; font-size:13px;">
                                    This is an automated email from
                                    <strong>
                                        IT Infra Management System
                                    </strong>

                                    <br><br>
                                    © Jindal Stainless Limited
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
}

module.exports = emailLayout;
