// auth.js
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
require('dotenv').config({ quiet: true });



const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

async function getAuthClient() {
    const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    oAuth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    return oAuth2Client;
}

module.exports = { getAuthClient };


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

