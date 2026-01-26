// src/utils/email.ts
// Using MailerSend API (HTTP) - works on Render free tier and locally

interface EmailPayload {
  from: {
    email: string;
    name: string;
  };
  to: Array<{ email: string }>;
  subject: string;
  html: string;
  text?: string; // optional plain-text fallback
}

const sendMailersendEmail = async (payload: EmailPayload) => {
  const apiKey = process.env.MAILERSEND_API_KEY;

  if (!apiKey) {
    console.error('Missing MAILERSEND_API_KEY');
    throw new Error('Email service not configured');
  }

  const response = await fetch('https://api.mailersend.com/v1/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail;
    try {
      errorDetail = await response.json();
    } catch {
      errorDetail = await response.text();
    }

    console.error('MailerSend API error:', {
      status: response.status,
      statusText: response.statusText,
      detail: errorDetail,
    });

    throw new Error(`Failed to send email: ${response.status} ${response.statusText}`);
  }

  console.log(`Email sent successfully to ${payload.to[0].email}`);
  return true;
};

export const sendVerificationEmail = async (to: string, token: string) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Library Portal!</h2>
      <p>Thank you for registering. Please verify your email by clicking the link below:</p>
      <p style="margin: 24px 0;">
        <a href="${verificationUrl}"
           style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Verify Email Address
        </a>
      </p>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't sign up, please ignore this email.</p>
      <hr style="border-color: #e5e7eb; margin: 32px 0;" />
      <p style="color: #6b7280; font-size: 0.875rem;">
        Library Portal – Nairobi, Kenya
      </p>
    </div>
  `;

  const payload: EmailPayload = {
    from: {
      email: process.env.MAILERSEND_FROM_EMAIL!,
      name: process.env.MAILERSEND_FROM_NAME || 'Library Portal',
    },
    to: [{ email: to }],
    subject: 'Verify Your Library Portal Account',
    html,
    // optional plain text version
    text: `Verify your email: ${verificationUrl}\n\nThis link expires in 24 hours.`,
  };

  return sendMailersendEmail(payload);
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Your Password</h2>
      <p>You requested a password reset. Click the button below to set a new password:</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}"
           style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Reset Password
        </a>
      </p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr style="border-color: #e5e7eb; margin: 32px 0;" />
      <p style="color: #6b7280; font-size: 0.875rem;">
        Library Portal – Nairobi, Kenya
      </p>
    </div>
  `;

  const payload: EmailPayload = {
    from: {
      email: process.env.MAILERSEND_FROM_EMAIL!,
      name: process.env.MAILERSEND_FROM_NAME || 'Library Portal',
    },
    to: [{ email: to }],
    subject: 'Reset Your Library Portal Password',
    html,
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
  };

  return sendMailersendEmail(payload);
};