// auth.js
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
require('dotenv').config({ quiet: true });

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = 'token.json';



async function getAuthClient() {
    const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    if (fs.existsSync(TOKEN_PATH)) {
        oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));
        return oAuth2Client;
    }

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });

    console.log('Authorize here:', authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const code = await new Promise(resolve =>
        rl.question('Code: ', resolve)
    );
    rl.close();

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));

    return oAuth2Client;
}



async function listCalendars() {
    const auth = await getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });

    const res = await calendar.calendarList.list();
    res.data.items.forEach(cal => {
        console.log(cal.summary, '->', cal.id);
    });
}

// listCalendars();





module.exports = { getAuthClient };

