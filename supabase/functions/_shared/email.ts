/**
 * ============================================================================
 * EMAIL UTILITIES
 * ============================================================================
 * Email utilities using Supabase Auth email system
 * ============================================================================
 */

import { supabase } from './supabase-client.ts';

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

// Send email using Supabase Auth
export async function sendEmail(options: EmailOptions): Promise<void> {
  // Note: Supabase free tier doesn't include custom email sending
  // This is a placeholder for when you upgrade to a paid plan
  // or use a third-party email service

  console.log('Email would be sent:', {
    to: options.to,
    subject: options.subject,
    from: options.from || 'noreply@farmersboot.com',
  });

  // For production, you would use a service like:
  // - Resend (https://resend.com)
  // - SendGrid (https://sendgrid.com)
  // - AWS SES
  // - Mailgun

  // Example with Resend:
  // const response = await fetch('https://api.resend.com/emails', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     from: options.from || 'noreply@farmersboot.com',
  //     to: options.to,
  //     subject: options.subject,
  //     html: options.html,
  //     text: options.text,
  //   }),
  // })

  // if (!response.ok) {
  //   throw new Error('Failed to send email')
  // }
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50;">Reset Your Password</h2>
          <p>You requested a password reset for your Farmers Boot account.</p>
          <p>Click the button below to reset your password:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #3498db;">${resetUrl}</p>
          <p style="margin-top: 30px; font-size: 14px; color: #7f8c8d;">
            This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
          </p>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Reset Your Password - Farmers Boot',
    html,
    text: `Reset your password by visiting: ${resetUrl}`,
  });
}

// Send email verification email
export async function sendEmailVerification(email: string, verifyUrl: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50;">Verify Your Email</h2>
          <p>Thank you for signing up for Farmers Boot!</p>
          <p>Please verify your email address by clicking the button below:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #27ae60;">${verifyUrl}</p>
          <p style="margin-top: 30px; font-size: 14px; color: #7f8c8d;">
            This link will expire in 24 hours. If you didn't create an account, please ignore this email.
          </p>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Verify Your Email - Farmers Boot',
    html,
    text: `Verify your email by visiting: ${verifyUrl}`,
  });
}

// Send welcome email
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Farmers Boot</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50;">Welcome to Farmers Boot!</h2>
          <p>Hi ${name},</p>
          <p>Welcome to Farmers Boot! We're excited to have you on board.</p>
          <p>With Farmers Boot, you can:</p>
          <ul>
            <li>Manage your farms and fields</li>
            <li>Track crop plans and activities</li>
            <li>Monitor livestock health</li>
            <li>Manage inventory and equipment</li>
            <li>Track financial records</li>
            <li>Get weather updates and recommendations</li>
          </ul>
          <p style="margin-top: 30px;">
            <a href="${Deno.env.get('APP_URL') || 'https://farmersboot.com'}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Get Started</a>
          </p>
          <p style="margin-top: 30px; font-size: 14px; color: #7f8c8d;">
            If you have any questions, feel free to reach out to our support team.
          </p>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to Farmers Boot!',
    html,
    text: `Welcome to Farmers Boot! Get started at ${Deno.env.get('APP_URL') || 'https://farmersboot.com'}`,
  });
}

// Send notification email
export async function sendNotificationEmail(
  email: string,
  title: string,
  message: string,
  actionUrl?: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50;">${title}</h2>
          <p>${message}</p>
          ${
            actionUrl
              ? `
            <p style="text-align: center; margin: 30px 0;">
              <a href="${actionUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Details</a>
            </p>
          `
              : ''
          }
          <p style="margin-top: 30px; font-size: 14px; color: #7f8c8d;">
            This is an automated notification from Farmers Boot.
          </p>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: title,
    html,
    text: `${message}${actionUrl ? `\n\nView details: ${actionUrl}` : ''}`,
  });
}
