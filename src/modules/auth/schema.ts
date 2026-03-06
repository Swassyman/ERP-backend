import z from "zod";
import { INSTITUTION_DOMAIN_REGEXP } from "@/constants.js";

export const loginSchema = z
	.object({
		email: z
			.email({ error: "Invalid email format" })
			.regex(INSTITUTION_DOMAIN_REGEXP, {
				error: "Expected institution domain email",
			}),
		password: z
			.string({ error: "Invalid password input" })
			.min(6, { error: "Password must be at least 6 characters" }),
	})
	.strict();

export type LoginSchema = z.output<typeof loginSchema>;
