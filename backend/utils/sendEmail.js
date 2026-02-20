import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// --- Strategy: Use Resend (HTTP) if available, fallback to Gmail (SMTP) ---

let resend = null;
let transporter = null;
let emailMethod = null;

const EMAIL_USER = process.env.ALERT_EMAIL_USER || process.env.EMAIL_USER;
const EMAIL_PASS = process.env.ALERT_EMAIL_PASS || process.env.EMAIL_PASS;

// Priority 1: Resend (HTTP API — works on Railway/cloud platforms that block SMTP)
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  emailMethod = 'resend';
  console.log('✅ Email service initialized (Resend HTTP API)');
}
// Priority 2: Gmail via Nodemailer (SMTP — works locally)
else if (EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
  emailMethod = 'nodemailer';
  console.log(`✅ Email service initialized (Gmail/Nodemailer) — sender: ${EMAIL_USER}`);
} else {
  console.warn('⚠️ Email service not configured. Set RESEND_API_KEY or ALERT_EMAIL_USER/ALERT_EMAIL_PASS');
}

const getFromEmail = () => {
  if (emailMethod === 'resend') {
    return process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  }
  return `"Evolexx Store" <${EMAIL_USER}>`;
};

export const sendEmail = async (to, subject, htmlContent) => {
  if (process.env.DISABLE_EMAIL === 'true') {
    console.warn('⚠️ Email sending is disabled (DISABLE_EMAIL=true). Skipping.');
    return;
  }

  if (!to || !to.includes('@')) {
    console.warn(`⚠️ Invalid recipient email: ${to}. Skipping.`);
    return;
  }

  if (!emailMethod) {
    console.warn('⚠️ No email service configured. Skipping.');
    return;
  }

  try {
    if (emailMethod === 'resend') {
      const { error } = await resend.emails.send({
        from: getFromEmail(),
        to,
        subject,
        html: htmlContent,
      });
      if (error) {
        console.error(`❌ Resend failed for ${to}:`, error.message);
        return;
      }
    } else {
      await transporter.sendMail({
        from: getFromEmail(),
        to,
        subject,
        html: htmlContent,
      });
    }
    console.log(`✅ Email sent to: ${to} (via ${emailMethod})`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
  }
};
