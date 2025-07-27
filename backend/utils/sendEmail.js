import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ALERT_EMAIL_USER,
    pass: process.env.ALERT_EMAIL_PASS,
  },
});

// ✅ Fix: change `text` to `htmlContent`
export const sendEmail = async (to, subject, htmlContent) => {
  await transporter.sendMail({
    from: process.env.ALERT_EMAIL_USER,
    to,
    subject,
    html: htmlContent, // ✅ This now matches the function param
  });
};