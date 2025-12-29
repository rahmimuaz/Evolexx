import nodemailer from 'nodemailer';

// Initialize Gmail email service
let transporter = null;

// Initialize Gmail transporter if credentials are provided
if (process.env.ALERT_EMAIL_USER && process.env.ALERT_EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.ALERT_EMAIL_USER,
      pass: process.env.ALERT_EMAIL_PASS, // Use Gmail App Password, not regular password
    },
    // Connection timeout settings
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
  
  // Verify transporter configuration on startup (non-blocking)
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Gmail email transporter verification failed:', error.message);
      console.error('Make sure you are using a Gmail App Password, not your regular password.');
      console.error('Get App Password: https://myaccount.google.com/apppasswords');
    } else {
      console.log('✅ Gmail email transporter ready');
    }
  });
} else {
  console.warn('⚠️ Gmail email service not configured. Set ALERT_EMAIL_USER and ALERT_EMAIL_PASS environment variables');
}

// ✅ Send email using Gmail
export const sendEmail = async (to, subject, htmlContent) => {
  // Check if email is disabled
  if (process.env.DISABLE_EMAIL === 'true') {
    console.warn('⚠️ Email sending is disabled (DISABLE_EMAIL=true). Skipping email send.');
    return;
  }

  // Check if email service is configured
  if (!transporter) {
    console.warn('⚠️ Gmail email service not configured. Skipping email send.');
    return;
  }

  // Check if email credentials are configured
  if (!process.env.ALERT_EMAIL_USER || !process.env.ALERT_EMAIL_PASS) {
    console.warn('⚠️ Gmail credentials not configured. Skipping email send.');
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.ALERT_EMAIL_USER,
      to,
      subject,
      html: htmlContent,
    });
    console.log(`✅ Email sent successfully to: ${to} (via Gmail)`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    // Don't throw - let it fail silently so it doesn't break order creation
  }
};