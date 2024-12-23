const nodemailer = require('nodemailer');

// Create a transporter using SMTP (Gmail example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = (email, verificationToken) => {
  const verificationURL = `${process.env.APP_BASE_URL}/verify/${verificationToken}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Please verify your email address',
    html: `<p>Click the following link to verify your email: <a href="${verificationURL}">Verify Email</a></p>`,
    text: `Click the following link to verify your email: ${verificationURL}`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Error sending verification email:', err);
    } else {
      console.log('Verification email sent:', info.response);
    }
  });
};

module.exports = { sendVerificationEmail };
