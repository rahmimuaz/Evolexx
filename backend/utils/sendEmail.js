import nodemailer from 'nodemailer';

// Create transporter with timeout and connection settings
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ALERT_EMAIL_USER,
    pass: process.env.ALERT_EMAIL_PASS,
  },
  // Add connection timeout settings
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000,
  // Retry settings
  pool: true,
  maxConnections: 1,
  maxMessages: 3,
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter verification failed:', error.message);
    console.error('Check your ALERT_EMAIL_USER and ALERT_EMAIL_PASS environment variables');
  } else {
    console.log('✅ Email transporter ready');
  }
});

// ✅ Fix: change `text` to `htmlContent`
export const sendEmail = async (to, subject, htmlContent) => {
  // Check if email credentials are configured
  if (!process.env.ALERT_EMAIL_USER || !process.env.ALERT_EMAIL_PASS) {
    console.warn('⚠️ Email credentials not configured. Skipping email send.');
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.ALERT_EMAIL_USER,
      to,
      subject,
      html: htmlContent, // ✅ This now matches the function param
    });
    console.log(`✅ Email sent successfully to: ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error; // Re-throw so caller can handle it
  }
};