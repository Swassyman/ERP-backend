import { z } from "zod";

export const TKMCE_EMAIL = z
	.email("Invalid email format.")
  .regex(/@tkmce\.ac\.in$/, "Email must be a @tkmce.ac.in address.");
  
export const CREATE_USER_SCHEMA = z
	.object({
		fullName: z
			.string()
			.min(1, "fullName cannot be empty.")
			.max(256, "fullName cannot exceed 256 characters."),
		email: TKMCE_EMAIL,
		password: z
			.string()
			.min(6, "Password must be at least 6 characters."),
	})
	.strict();

export const CREATE_ORGANIZATION_SCHEMA = z
	.object({
		name: z
			.string()
			.min(1, "name cannot be empty.")
			.max(256, "name cannot exceed 256 characters."),
		type: z.enum(["department", "club", "institution"], {
			message: "type must be one of: department, club, institution.",
		}),
		parentOrganizationId: z
			.number()
			.int("parentOrganizationId must be an integer.")
			.positive("parentOrganizationId must be a positive number.")
			.optional(),
	})
	.strict();

export const ASSIGN_ROLE_SCHEMA = z
	.object({
		userId: z
			.number()
			.int("userId must be an integer.")
			.positive("userId must be a positive number."),
		roleId: z
			.number()
			.int("roleId must be an integer.")
			.positive("roleId must be a positive number."),
		organizationId: z
			.number()
			.int("organizationId must be an integer.")
			.positive("organizationId must be a positive number."),
	})
	.strict();