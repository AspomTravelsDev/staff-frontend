import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
    try {
        const { email, inviteLink } = await request.json();

        if (!email || !inviteLink) {
            return NextResponse.json(
                { error: "Email and invite link are required" },
                { status: 400 }
            );
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: '"Aspom Portal" <' + process.env.SMTP_USER + '>',
            to: email,
            subject: "You have been invited to join Aspom Portal",
            html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f9fafb;">
      <h1 style="color: #111827; font-size: 28px; font-weight: 700; margin-top: 0; margin-bottom: 32px; text-align: center;">
        Aspom Portal
      </h1>
      
      <h2 style="color: #374151; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 20px;">
        You've been invited!
      </h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
        You have been invited to join the <strong>Aspom Portal</strong> staff team. We're excited to have you on board!
      </p>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 32px;">
        Please click the button below to set up your account and get started:
      </p>
      
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${inviteLink}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Accept Invitation
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin-bottom: 0;">
        If you were not expecting this invitation, you can safely ignore this email.
      </p>
      
      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} Aspom Portal. All rights reserved.
        </p>
      </div>
    </div>
  `,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error sending email:", error);
        return NextResponse.json(
            { error: "Failed to send email" },
            { status: 500 }
        );
    }
}
