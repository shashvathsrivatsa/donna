const { google } = require("googleapis");
require("dotenv").config({ quiet: true });


const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "http://localhost"
);

oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

const gmail = google.gmail({ version: "v1", auth: oauth2Client });


function makeEmail(to, from, subject, body) {
    const msg = [
        `To: ${to}`,
        `From: ${from}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset="UTF-8"`,
        ``,
        body,
    ].join("\r\n");

    return Buffer.from(msg).toString("base64url");
}

async function sendEmail(subject = "automation", body = "automation") {
    const to = "shash.srivatsa@icloud.com";
    const raw = makeEmail(to, to, subject, body);

    const res = await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw },
    });
    console.log(`Email sent: ${res.data.id}`);
}

module.exports = { sendEmail };

