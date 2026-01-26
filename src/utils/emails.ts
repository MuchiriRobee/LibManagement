// src/utils/email.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

  await transporter.sendMail({
    from: `"Library Portal" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify Your Library Portal Account',
    html,
  });
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

  await transporter.sendMail({
    from: `"Library Portal" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset Your Library Portal Password',
    html,
  });
};