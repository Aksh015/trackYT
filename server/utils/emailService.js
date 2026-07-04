const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

const sendOTP = async (email, otp) => {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    logger.warn(`Email not sent. SMTP not configured. OTP for ${email} is ${otp}`);
    return;
  }

  const mailOptions = {
    from: `"TrackYT" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: 'Your TrackYT Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #111827;">Welcome to TrackYT!</h2>
        <p style="color: #4B5563; font-size: 16px;">
          Please use the following 6-digit code to verify your email address and complete your registration:
        </p>
        <div style="background-color: #F3F4F6; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
          <h1 style="color: #FF3B30; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #6B7280; font-size: 14px;">
          This code will expire in 4 minutes. If you did not sign up for an account, you can safely ignore this email.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`OTP sent successfully to ${email}`);
  } catch (error) {
    logger.error(`Failed to send OTP to ${email}:`, error);
    throw new Error('Failed to send verification email');
  }
};

module.exports = {
  sendOTP
};
