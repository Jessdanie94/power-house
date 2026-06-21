const emailTemplate = (customerName, missionName) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Courier New', Courier, monospace; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 20px; }
        .container { border: 2px solid #50C878; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto; box-shadow: 0 0 15px #50C878; }
        .header { text-align: center; border-bottom: 1px solid #50C878; padding-bottom: 10px; }
        .header h1 { color: #50C878; letter-spacing: 5px; text-transform: uppercase; }
        .content { margin-top: 20px; line-height: 1.6; }
        .accent { color: #50C878; font-weight: bold; }
        .footer { margin-top: 30px; font-size: 0.8em; color: #888; text-align: center; }
        .logo { width: 150px; display: block; margin: 0 auto 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://raw.githubusercontent.com/Jessdanie94/power-house/main/public/logo.png" alt="JDV Logo" class="logo" onerror="this.style.display='none'">
            <h1>Mission Confirmed</h1>
        </div>
        <div class="content">
            <p>Greetings, <span class="accent">${customerName}</span>,</p>
            <p>Your requisition for <span class="accent">${missionName}</span> has been authorized. We are currently architecting your tomorrow.</p>
            <p>Status: <span class="accent">ACTIVE</span></p>
            <p>Our systems are syncing with your parameters. Prepare for deployment.</p>
        </div>
        <div class="footer">
            <p>&copy; 2026 Jesse's Digital Ventures | Architecting Tomorrow</p>
            <p>System ID: POWERHOUSE-V1</p>
        </div>
    </div>
</body>
</html>
`;

module.exports = {
    sendMissionConfirmedEmail: async (customerEmail, customerName, missionName) => {
        const html = emailTemplate(customerName, missionName);
        console.log(`[Email Service] Preparing 'Mission Confirmed' email for ${customerEmail}`);
        console.log(`[Email Service] Template: Architecting Tomorrow (Emerald Accents)`);
        // Logic for Resend/SendGrid will go here once API key is provided
        console.log(`[Email Service] MOCK SEND: Email sent to ${customerEmail}`);
        return { success: true, message: 'Email logged (API key pending)' };
    }
};