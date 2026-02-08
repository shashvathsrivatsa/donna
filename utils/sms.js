require('dotenv').config({ quiet: true });
const nodemailer = require('nodemailer');

// Use a free email service
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

async function sendSMS(message) {
    console.log("Sending SMS: ", message);

    const mailOptions = {
        from: process.env.EMAIL,
        to: `${process.env.PHONE_NUMBER}@vtext.com`,
        subject: '', // Keep empty for cleaner SMS
        text: message
    };

    try {
        transporter.sendMail(mailOptions);
        console.log('SMS sent successfully');
    } catch (error) {
        console.error('Error sending SMS: ', error);
    }
}

// sendSMS("calendar-update");


module.exports = {
    sendSMS
};
