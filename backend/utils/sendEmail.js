import { Resend } from 'resend';

// Initialize Resend email service (HTTP API - works on Railway)
let resend = null;

// Initialize Resend if API key is provided
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log('✅ Resend email service initialized (HTTP API - works on Railway)');
} else {
  console.warn('⚠️ Resend email service not configured. Set RESEND_API_KEY environment variable');
  console.warn('⚠️ Get your API key at: https://resend.com/api-keys');
  console.warn('⚠️ Free tier: 3,000 emails/month');
}

// Get the "from" email address
const getFromEmail = () => {
  // Use RESEND_FROM_EMAIL if set, otherwise use EMAIL_USER, or default Resend email
  return process.env.RESEND_FROM_EMAIL || process.env.EMAIL_USER || 'onboarding@resend.dev';
};

// ✅ Send email using Resend (HTTP API)
export const sendEmail = async (to, subject, htmlContent) => {
  // Check if email is disabled
  if (process.env.DISABLE_EMAIL === 'true') {
    console.warn('⚠️ Email sending is disabled (DISABLE_EMAIL=true). Skipping email send.');
    return;
  }

  // Check if Resend is configured
  if (!resend) {
    console.warn('⚠️ Resend email service not configured. Skipping email send.');
    return;
  }

  // Check if API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured. Skipping email send.');
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
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
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    // Don't throw - let it fail silently so it doesn't break order creation
  }
};