require("dotenv").config({ quiet: true });
const { google } = require("googleapis");
const { v4: uuidv4 } = require("uuid");

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const calendar = google.calendar({
    version: "v3",
    auth: oauth2Client
});



async function createWatch() {
    const response = await calendar.events.watch({
        calendarId: "primary",
        requestBody: {
            id: uuidv4(), // unique per channel
            type: "web_hook",
            address: "https://donna-pm0k.onrender.com/webhooks/google-calendar"
        }
    });

    console.log("Watch created:", response.data);
}

//  display calendar.events.watch()
con

// createWatch();

