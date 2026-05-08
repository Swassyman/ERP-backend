import { hashPassword } from "@/lib/argon2.js";
import { generateSecureString } from "@/lib/token.js";
import * as repository from "./repository.js";
import type { CreateUserSchema } from "./schema.js";

export async function createUser(input: CreateUserSchema) {
	const initial_password = generateSecureString();
	return await repository.insertUser({
		email: input.email,
		fullName: input.fullName,
		passwordHash: await hashPassword(initial_password),
	});
}

export async function getUsers() {
	return await repository.getUsers();
}
