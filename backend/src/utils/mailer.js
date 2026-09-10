import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";

const srcDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(srcDirectory, "..", ".env") });

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // true for port 465, false for 587/others
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const verifyMailer = async () => {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error("SMTP_HOST, SMTP_USER, and SMTP_PASS must be configured");
    }

    await transporter.verify();
};

const sendVerificationEmail = async (toEmail, token) => {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const verificationLink = `${clientUrl}/verify-email/${token}`;

    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: toEmail,
        subject: "Verify your email address",
        html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
                <h2>Confirm your email</h2>
                <p>Thanks for signing up! Please confirm your email address to activate your account.</p>
                <p>
                    <a href="${verificationLink}"
                       style="display:inline-block;padding:10px 20px;background:#D97500;color:#fff;
                              text-decoration:none;border-radius:6px;">
                        Verify Email
                    </a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p><a href="${verificationLink}">${verificationLink}</a></p>
                <p style="color:#888;font-size:0.85rem;">This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
            </div>
        `,
    });
};

export { sendVerificationEmail, verifyMailer };