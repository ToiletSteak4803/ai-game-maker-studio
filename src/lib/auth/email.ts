import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "1025"),
  secure: process.env.SMTP_SECURE === "true",
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
});

export async function sendMagicLinkEmail(
  email: string,
  token: string
): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const magicLink = `${baseUrl}/auth/verify?token=${token}`;

  try {
    // In development, just log the link
    if (process.env.NODE_ENV === "development") {
      console.log("\n========================================");
      console.log("MAGIC LINK (dev mode):");
      console.log(magicLink);
      console.log("========================================\n");
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "AI Game Maker Studio <noreply@aigamemaker.dev>",
      to: email,
      subject: "Sign in to AI Game Maker Studio",
      text: `Click this link to sign in: ${magicLink}\n\nThis link expires in 15 minutes.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; background: #f5f5f5;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h1 style="font-size: 24px; margin: 0 0 24px; color: #111;">Sign in to AI Game Maker Studio</h1>
            <p style="color: #666; margin: 0 0 24px; line-height: 1.6;">
              Click the button below to sign in to your account. This link will expire in 15 minutes.
            </p>
            <a href="${magicLink}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 500;">
              Sign in
            </a>
            <p style="color: #999; font-size: 14px; margin: 32px 0 0;">
              If you didn't request this email, you can safely ignore it.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    return true;
  } catch (error) {
    console.error("Failed to send magic link email:", error);
    return false;
  }
}
