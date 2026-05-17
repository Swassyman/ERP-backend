import { hashPassword } from "@/lib/argon2.js";
import { sendEmail } from "@/lib/email.js";
import { getPasswordSetupContent } from "@/lib/email-templates.js";
import { generateSecureString, hexSha256, quickEnv } from "@/lib/helpers.js";
import * as repository from "./repository.js";
import type { CreateUserSchema } from "./schema.js";

export async function createUser(input: CreateUserSchema) {
	const initial_password = generateSecureString();
	const token = generateSecureString(32);
	const tokenHash = hexSha256(token);

	const user = await repository.insertUser(
		{
			email: input.email,
			fullName: input.fullName,
			passwordHash: await hashPassword(initial_password),
		},
		{
			tokenHash,
		},
	);

	const frontendUrl = quickEnv("FRONTEND_ORIGIN", true);
	const setupUrl = `${frontendUrl}/reset-password?token=${token}`; //todo: change the url as needed for frontend
	const html = getPasswordSetupContent(setupUrl);

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
