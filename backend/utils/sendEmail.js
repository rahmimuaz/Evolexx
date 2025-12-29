import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// Initialize email service (Resend preferred, nodemailer as fallback)
let emailService = null;
let useResend = false;

// Initialize Resend if API key is provided (recommended for Railway)
if (process.env.RESEND_API_KEY) {
  emailService = new Resend(process.env.RESEND_API_KEY);
  useResend = true;
  console.log('✅ Resend email service initialized (HTTP API - works on Railway)');
} else if (process.env.ALERT_EMAIL_USER && process.env.ALERT_EMAIL_PASS) {
  // Fallback to nodemailer if Resend is not configured
  console.warn('⚠️ RESEND_API_KEY not found. Using nodemailer (may not work on Railway).');
  console.warn('⚠️ For Railway, use Resend: https://resend.com (free tier: 3,000 emails/month)');
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.ALERT_EMAIL_USER,
      pass: process.env.ALERT_EMAIL_PASS,
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
    pool: false,
  });
  
  transporter.verify((error) => {
    if (error) {
      console.error('❌ Email transporter verification failed:', error.message);
    } else {
      console.log('✅ Email transporter ready (nodemailer fallback)');
    }
  });
  
  emailService = transporter;
  useResend = false;
} else {
  console.warn('⚠️ Email service not configured. Set RESEND_API_KEY or ALERT_EMAIL_USER/ALERT_EMAIL_PASS');
}

// Get the "from" email address
const getFromEmail = () => {
  // Use RESEND_FROM_EMAIL if set, otherwise use ALERT_EMAIL_USER, or default
  return process.env.RESEND_FROM_EMAIL || process.env.ALERT_EMAIL_USER || 'onboarding@resend.dev';
};

// Get the "from" email address
const getFromEmail = () => {
  // Use RESEND_FROM_EMAIL if set, otherwise use ALERT_EMAIL_USER, or default
  return process.env.RESEND_FROM_EMAIL || process.env.ALERT_EMAIL_USER || 'onboarding@resend.dev';
};

// ✅ Send email using Resend (HTTP API) or nodemailer fallback
export const sendEmail = async (to, subject, htmlContent) => {
  // Check if email is disabled
  if (process.env.DISABLE_EMAIL === 'true') {
    console.warn('⚠️ Email sending is disabled (DISABLE_EMAIL=true). Skipping email send.');
    return;
  }

  // Check if email service is configured
  if (!emailService) {
    console.warn('⚠️ Email service not configured. Skipping email send.');
    return;
  }

  try {
    if (useResend) {
      // Use Resend (HTTP API) - works on Railway
      const { data, error } = await emailService.emails.send({
        from: getFromEmail(),
        to: to,
        subject: subject,
        html: htmlContent,
      });

      if (error) {
        console.error(`❌ Failed to send email to ${to}:`, error.message);
        return;
      }

      console.log(`✅ Email sent successfully to: ${to} (via Resend)`);
    } else {
      // Fallback to nodemailer (likely won't work on Railway)
      await emailService.sendMail({
        from: process.env.ALERT_EMAIL_USER,
        to,
        subject,
        html: htmlContent,
      });
      console.log(`✅ Email sent successfully to: ${to} (via nodemailer fallback)`);
    }
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    // Don't throw - let it fail silently so it doesn't break order creation
  }
};