// getRefreshToken.js (run this once, then delete)
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
require('dotenv').config();

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

async function getRefreshToken() {
    const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent' // Forces refresh token
    });

    console.log('Authorize here:', authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const code = await new Promise(resolve =>
        rl.question('Enter code: ', resolve)
    );
    rl.close();

    const { tokens } = await oAuth2Client.getToken(code);
    console.log('\nAdd this to your .env file:');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
}

getRefreshToken();
