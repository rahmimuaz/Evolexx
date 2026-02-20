import nodemailer from 'nodemailer';

let transporter = null;

const EMAIL_USER = process.env.ALERT_EMAIL_USER || process.env.EMAIL_USER;
const EMAIL_PASS = process.env.ALERT_EMAIL_PASS || process.env.EMAIL_PASS;

if (EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
  console.log(`✅ Email service initialized (Gmail/Nodemailer) — sender: ${EMAIL_USER}`);
} else {
  console.warn('⚠️ Email service not configured. Set ALERT_EMAIL_USER and ALERT_EMAIL_PASS in .env');
}

export const sendEmail = async (to, subject, htmlContent) => {
  if (process.env.DISABLE_EMAIL === 'true') {
    console.warn('⚠️ Email sending is disabled (DISABLE_EMAIL=true). Skipping.');
    return;
  }

  if (!to || !to.includes('@')) {
    console.warn(`⚠️ Invalid recipient email: ${to}. Skipping.`);
    return;
  }

  if (!transporter) {
    console.warn('⚠️ Email transporter not configured. Skipping.');
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Evolexx Store" <${EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    });
    console.log(`✅ Email sent to: ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
  }
};
