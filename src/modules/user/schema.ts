import z from "zod";
import { INSTITUTION_DOMAIN_REGEXP } from "@/constants.js";

export const createUserSchema = z
	.object({
		email: z
			.email({ error: "Invalid email" })
			.regex(INSTITUTION_DOMAIN_REGEXP, {
				error: "Email must belong to the institution",
			}),
		password: z
			.string({ error: "Invalid password input" })
			.min(6, { error: "Password must be at least 6 characters long" }),
		fullName: z
			.string({ error: "Invalid name input" })
			.trim()
			.nonempty({ error: "Name cannot be empty" })
			.max(256, { error: "Name cannot exceed 256 characters" }),
	})
	.strict();

export type CreateUserSchema = z.output<typeof createUserSchema>;
