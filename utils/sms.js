const nodemailer = require('nodemailer');

// Use a free email service
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'shashvaths@gmail.com',
        pass: 'aazn qyjv jlzr ojqg'
    }
});

function sendSMS(message) {
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: '4086570906@vtext.com',
        subject: '', // Keep empty for cleaner SMS
        text: message
    };

    transporter.sendMail(mailOptions);
}

// sendSMS("calendar-update");


module.exports = {
    sendSMS
};
