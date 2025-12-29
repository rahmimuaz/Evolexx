import nodemailer from 'nodemailer';

// Create transporter with explicit Gmail SMTP settings
// Try port 465 (SSL) first, as Railway may block port 587
const createTransporter = () => {
  // Check if email is disabled via environment variable
  if (process.env.DISABLE_EMAIL === 'true') {
    return null;
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // Use SSL port (465) instead of TLS port (587)
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.ALERT_EMAIL_USER,
      pass: process.env.ALERT_EMAIL_PASS,
    },
    // Shorter timeouts to fail fast
    connectionTimeout: 5000, // 5 seconds
    greetingTimeout: 5000,
    socketTimeout: 5000,
    // Disable pooling to avoid connection issues
    pool: false,
  });
};

const transporter = createTransporter();

// Verify transporter configuration on startup
if (transporter) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email transporter verification failed:', error.message);
      console.error('Check your ALERT_EMAIL_USER and ALERT_EMAIL_PASS environment variables');
      console.error('Note: Railway may block SMTP connections. Consider using an email API service like SendGrid or Resend.');
    } else {
      console.log('✅ Email transporter ready');
    }
  });
} else {
  console.warn('⚠️ Email sending is disabled (DISABLE_EMAIL=true or missing credentials)');
}

// ✅ Fix: change `text` to `htmlContent`
export const sendEmail = async (to, subject, htmlContent) => {
  // Check if email is disabled
  if (!transporter) {
    console.warn('⚠️ Email sending is disabled. Skipping email send.');
    return;
  }

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
    // Don't throw - let it fail silently so it doesn't break order creation
    // The caller already handles errors with .catch()
  }
};