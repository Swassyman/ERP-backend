import z from "zod";
import { INSTITUTION_DOMAIN } from "@/lib/constants.js";

export const loginSchema = z
	.object({
		email: z
			.email({ error: "Invalid email format" })
			.endsWith(INSTITUTION_DOMAIN, { error: "Expected institution domain email" }),
		password: z
			.string({ error: "Invalid password input" })
			.min(6, { error: "Password must be at least 6 characters" }),
	})
	.strict();

export type LoginSchema = z.output<typeof loginSchema>;

export const resetPasswordSchema = z
	.object({
		token: z.string({ error: "Token is required" }).trim().nonempty(),
		password: z
			.string({ error: "Invalid password input" })
			.min(6, { error: "Password must be at least 6 characters" }),
	})
	.strict();

export type ResetPasswordSchema = z.output<typeof resetPasswordSchema>;
