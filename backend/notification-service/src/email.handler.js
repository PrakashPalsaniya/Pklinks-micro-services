import nodemailer from 'nodemailer';
import config from '@pklinks/config';


const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465, // true for 465, false for other ports
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export async function handleEmailMessage(payload) {
  const { to, template, data } = payload;
  
  console.log(`[notification-service] Sending ${template} email to ${to}`);

  let subject = '';
  let html = '';

  switch (template) {
    case 'forgot_password':
      subject = 'Reset Your Password - PKLinks';
      html = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>Hi ${data.name},</p>
          <p>We received a request to reset your password. Click the button below to choose a new one:</p>
          <a href="${data.resetLink}" style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        </div>
      `;
      break;

    case 'password_reset_confirmation':
      subject = 'Password Changed Successfully - PKLinks';
      html = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Password Changed</h2>
          <p>Hi ${data.name},</p>
          <p>This is a confirmation that your password has been successfully changed.</p>
          <p>If you did not perform this action, please contact support immediately.</p>
        </div>
      `;
      break;

    default:
      console.warn(`[notification-service] Unknown template: ${template}`);
      return;
  }

  // NOTE: We intentionally let errors bubble up so the caller (rabbitmq subscriber)
  // can nack the message and requeue it for retry. Do NOT swallow errors here.
  const info = await transporter.sendMail({
    from: `"PKLinks" <${config.smtp.user}>`,
    to,
    subject,
    html,
  });

  console.log(`[notification-service] Email sent: ${info.messageId}`);
  
  if (info.messageId && info.messageId.includes('ethereal')) {
    console.log(`[notification-service] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }
}
