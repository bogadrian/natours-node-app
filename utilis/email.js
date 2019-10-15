const nodemailer = require('nodemailer');

// sendEmail function to be called from authController by forgotPassword function. it may be used in confirm password email for signup if you want to implemet that step. for future use
const sendEmail = async options => {
  //Setup the transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  //define email options
  const mailOptions = {
    from: 'bogdan Adrian <bogdan4adrian@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  //send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
