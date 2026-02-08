require('dotenv').config({ quiet: true });
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(message) {
    const msg = {
        to: `shash.srivatsa@icloud.com`,
        from: process.env.EMAIL,
        subject: message,
        text: "RUN",
    };

    await sgMail.send(msg);
    console.log('Email sent');
}

// sendEmail('Y');

