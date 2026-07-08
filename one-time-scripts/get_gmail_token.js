const { google } = require('googleapis');
const http = require('http');
const url = require('url');
require('dotenv').config({ quiet: true });

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'http://127.0.0.1:4242/callback';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.send'],
    prompt: 'consent',
});

console.log('\nOpen this URL in your browser:\n');
console.log(authUrl);
console.log('');

const server = http.createServer(async (req, res) => {
    const code = new url.URL(req.url, 'http://127.0.0.1:4242').searchParams.get('code');
    if (!code) { res.end('No code'); return; }

    res.end('Done! Check your terminal for the refresh token.');
    server.close();

    const { tokens } = await oauth2Client.getToken(code);
    console.log('\nRefresh token (add to .env as REFRESH_TOKEN):');
    console.log(tokens.refresh_token);
});

server.listen(4242, () => console.log('Waiting for Google redirect on http://127.0.0.1:4242/callback ...'));
