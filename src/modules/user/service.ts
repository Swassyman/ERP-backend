import { hashPassword } from "@/utilities/argon2.js";
import * as repository from "./repository.js";
import type { CreateUserSchema } from "./schema.js";

export async function createUser(input: CreateUserSchema) {
	return await repository.insertUser({
		email: input.email,
		fullName: input.fullName,
		passwordHash: await hashPassword(input.password),
	});
}

export async function getUsers() {
	return await repository.getUsers();
}
