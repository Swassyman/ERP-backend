import { hashPassword } from "@/lib/argon2.js";
import { sendEmail } from "@/lib/email.js";
import { getPasswordSetupHtml } from "@/lib/email-templates.js";
import { generateSecureString, hashToken, quickEnv } from "@/lib/helpers.js";
import * as repository from "./repository.js";
import type { CreateUserSchema } from "./schema.js";

export async function createUser(input: CreateUserSchema) {
	const initial_password = generateSecureString();
	const token = generateSecureString(32);
	const tokenHash = hashToken(token);
	const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // todo: Now the expiry is 24hrs, Can be increased if needed.

	const user = await repository.insertUser(
		{
			email: input.email,
			fullName: input.fullName,
			passwordHash: await hashPassword(initial_password),
		},
		{
			tokenHash,
			type: "initial_setup",
			expiresAt,
		},
	);

	const frontendUrl = quickEnv("FRONTEND_ORIGIN", true);
	const setupUrl = `${frontendUrl}/setup-password?token=${token}`;
	const html = getPasswordSetupHtml(setupUrl);

	try {
		await sendEmail(input.email, "Welcome! Set up your password", html);
	} catch (error) {
		await repository.rollbackUserCreation(user.id); //for deleting the user if email fails to send (useless entry in user table can be there which can cause problems).
		throw error;
	}

	return user;
}

export async function getUsers() {
	return await repository.getUsers();
}
