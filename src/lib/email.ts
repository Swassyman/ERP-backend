import nodemailer from "nodemailer";
import { AppError, ERROR_CODES } from "./errors.js";
import { quickEnv } from "./helpers.js";

const SMTP_USER = quickEnv("SMTP_USER") || ""; //Our gmail
const SMTP_PASS = quickEnv("SMTP_PASS") || ""; //Gmail app password(16 chars)
const SMTP_FROM = `TKMCE Clubs Portal <${SMTP_USER}>`; //Change the name as i dont k what it will be called

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: SMTP_USER,
		pass: SMTP_PASS,
	},
});

export async function sendEmail(to: string, subject: string, html: string) {
	try {
		await transporter.sendMail({
			from: SMTP_FROM,
			to,
			subject,
			html,
		});
	} catch (error) {
		console.error("Failed to send email:", error);
		throw new AppError(500, ERROR_CODES.internal_server_error, "Failed to dispatch email");
	}
}
