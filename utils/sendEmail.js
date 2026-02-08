require('dotenv').config({ quiet: true });
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail() {
    const msg = {
        to: "shash.srivatsa@icloud.com",
        from: "shashvaths@gmail.com",
        subject: "automation",
        text: "automation",
    };

    await sgMail.send(msg);
    console.log('Email sent');
}

// sendEmail();

module.exports = {
    sendEmail,
};

