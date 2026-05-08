import { hashPassword } from "@/lib/argon2.js";
import { sendEmail } from "@/lib/email.js";
import { getPasswordSetupHtml } from "@/lib/email-templates.js";
import { generateSecureString, quickEnv } from "@/lib/helpers.js";
import * as repository from "./repository.js";
import type { CreateUserSchema } from "./schema.js";

export async function createUser(input: CreateUserSchema) {
	const initial_password = generateSecureString();
	const user = await repository.insertUser({
		email: input.email,
		fullName: input.fullName,
		passwordHash: await hashPassword(initial_password),
	});

	const rawToken = generateSecureString(32);
	const tokenHash = await hashPassword(rawToken);
	const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); //Now the expiry is 24hrs, Can be increased later if needed. 

	await repository.insertPasswordToken({
		userId: user.id,
		tokenHash,
		type: "INITIAL_SETUP",
		expiresAt,
	});

	const frontendUrl = quickEnv("FRONTEND_ORIGIN", true);
	const setupUrl = `${frontendUrl}/setup-password?token=${rawToken}`;
	const html = getPasswordSetupHtml(setupUrl);

	await sendEmail(input.email, "Welcome! Set up your password", html);

	return user;
}

export async function getUsers() {
	return await repository.getUsers();
}
