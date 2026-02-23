<<<<<<< HEAD
import type { Request } from "express";
import { z } from "zod";
import { db } from "../config/db.js";
import { organization, organizationUserRole, user } from "../config/schema.js";
import type { ApiResponse, OrganizationType } from "../config/types.js";
import { INSTITUTION_DOMAIN_REGEXP, ORGANIZATION_TYPES } from "../constants.js";
import { hashPassword } from "../utilities/argon2.js";
import { ERROR_CODES } from "../utilities/errors.js";
import { getPgErrorCode, unreachable } from "../utilities/helpers.js";
=======
import type { Request, Response } from "express";
import { z } from "zod";
import { db } from "../config/db.js";
import { organization, organizationUserRole, user } from "../config/schema.js";
import { INSTITUTION_DOMAIN_REGEXP } from "../constants.js";
import { hashPassword } from "../utilities/argon2.js";
>>>>>>> 6e7e8cb (minor cleanup: organizing imports, better practices)

const createUserSchema = z
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
			.nonempty({ error: "Name cannot be empty" })
			.max(256, { error: "Name cannot exceed 256 characters" }),
	})
	.strict();

export const createUser = async (
	req: Request,
	res: ApiResponse<{
		user: {
			id: number;
			fullName: string;
			email: string;
			createdAt: string;
		};
	}>,
) => {
	const parsed = createUserSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({
			code: ERROR_CODES.validation_error,
			message: "Invalid details",
		});
	}

<<<<<<< HEAD
	try {
=======
const tkmceEmail = z
	.email("Invalid email format.")
	.regex(INSTITUTION_DOMAIN_REGEXP, "Email must be a @tkmce.ac.in address.");

const CREATE_USER_SCHEMA = z
	.object({
		fullName: z
			.string()
			.min(1, "fullName cannot be empty.")
			.max(256, "fullName cannot exceed 256 characters."),
		email: tkmceEmail,
		password: z.string().min(6, "Password must be at least 6 characters."),
	})
	.strict();

export const createUser = async (req: Request, res: Response) => {
	try {
		const { fullName, email, password } = CREATE_USER_SCHEMA.parse(
			req.body,
		);

		const passwordHash = await hashPassword(password);

>>>>>>> 6e7e8cb (minor cleanup: organizing imports, better practices)
		const [newUser] = await db
			.insert(user)
			.values({
				email: parsed.data.email,
				passwordHash: await hashPassword(parsed.data.password),
				fullName: parsed.data.fullName,
			})
			.returning({
				id: user.id,
				fullName: user.fullName,
				email: user.email,
				createdAt: user.createdAt,
			});

		if (newUser == null) {
			unreachable();
		}

		return res.status(201).json({
			data: { user: newUser },
		});
	} catch (error) {
<<<<<<< HEAD
		const pgErrorCode = getPgErrorCode(error);
		if (pgErrorCode === "23505") {
			return res.status(409).json({
				code: ERROR_CODES.already_exists,
				message: "A user with this email already exists.",
=======
		if (error instanceof z.ZodError) {
			return res.status(400).json({
				message: "Invalid request.",
				errors: formatZodErrors(error),
>>>>>>> 6e7e8cb (minor cleanup: organizing imports, better practices)
			});
		}

		throw error;
	}
};

<<<<<<< HEAD
const createOrganizationSchema = z
	.object({
		name: z
			.string({ error: "Invalid name value" })
			.nonempty({ error: "Name cannot be empty" })
			.max(256, { error: "Name cannot exceed 256 characters" }),
		type: z.enum(ORGANIZATION_TYPES, {
			error: "Invalid organization type",
		}),
		parentOrganizationId: z
			.int({ error: "Invalid organization ID" })
=======
const CREATE_ORGANIZATION_SCHEMA = z
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
>>>>>>> 6e7e8cb (minor cleanup: organizing imports, better practices)
			.optional(),
	})
	.strict();

<<<<<<< HEAD
export const createOrganization = async (
	req: Request,
	res: ApiResponse<{
		organization: {
			id: number;
			name: string;
			type: OrganizationType;
			parentOrganizationId: number | null;
			createdAt: string;
		};
	}>,
) => {
	const parsed = createOrganizationSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({
			code: ERROR_CODES.validation_error,
			message: "Invalid details",
		});
	}

=======
export const createOrganization = async (req: Request, res: Response) => {
>>>>>>> 6e7e8cb (minor cleanup: organizing imports, better practices)
	try {
		const { name, type, parentOrganizationId } = parsed.data;

		const [newOrg] = await db
			.insert(organization)
			.values({
				name,
				type,
				parentOrganizationId: parentOrganizationId ?? null,
			})
			.returning({
				id: organization.id,
				name: organization.name,
				type: organization.type,
				parentOrganizationId: organization.parentOrganizationId,
				createdAt: organization.createdAt,
			});

		if (newOrg == null) {
			unreachable();
		}

		return res.status(201).json({
			data: {
				organization: newOrg,
			},
		});
	} catch (error) {
<<<<<<< HEAD
		const pgErrorCode = getPgErrorCode(error);
		if (pgErrorCode === "23505") {
			return res.status(409).json({
				code: ERROR_CODES.already_exists,
				message: "An organization with the same name already exists",
			});
		}
		if (pgErrorCode === "23503") {
			return res.status(409).json({
				code: ERROR_CODES.already_exists,
				message: "Invalid parent organization",
			});
		}

		throw error;
	}
};

const assignRoleSchema = z
	.object({
		userId: z.int({ error: "Invalid user ID" }),
		roleId: z.int({ error: "Invalid role ID" }),
		organizationId: z.int({ error: "Invalid organization ID" }),
	})
	.strict();

export const assignRole = async (
	req: Request,
	res: ApiResponse<{
		roleAssignment: {
			id: number;
			userId: number;
			roleId: number;
			organizationId: number;
			createdAt: string;
		};
	}>,
) => {
	const parsed = assignRoleSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({
			code: ERROR_CODES.validation_error,
			message: "Invalid details",
		});
	}

=======
		if (error instanceof z.ZodError) {
			return res.status(400).json({
				message: "Invalid request.",
				errors: formatZodErrors(error),
			});
		}

		const pgCode = getPgCode(error as PgError);

		if (pgCode === "23505") {
			return res.status(409).json({
				message: "An organization with this name already exists.",
			});
		}
		if (pgCode === "23503") {
			return res
				.status(400)
				.json({ message: "parentOrganizationId does not exist." });
		}

		console.error(error);
		return res.status(500).json({ message: "Internal server error." });
	}
};

const ASSIGN_ROLE_SCHEMA = z
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

export const assignRole = async (req: Request, res: Response) => {
>>>>>>> 6e7e8cb (minor cleanup: organizing imports, better practices)
	try {
		const { userId, roleId, organizationId } = parsed.data;

		const [assignment] = await db
			.insert(organizationUserRole)
			.values({ userId, roleId, organizationId })
			.returning({
				id: organizationUserRole.id,
				userId: organizationUserRole.userId,
				roleId: organizationUserRole.roleId,
				organizationId: organizationUserRole.organizationId,
				createdAt: organizationUserRole.createdAt,
			});

<<<<<<< HEAD
		if (assignment == null) {
			unreachable();
=======
		return res
			.status(201)
			.json({ message: "Role assigned successfully.", assignment });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({
				message: "Invalid request.",
				errors: formatZodErrors(error),
			});
>>>>>>> 6e7e8cb (minor cleanup: organizing imports, better practices)
		}

		return res.status(201).json({
			data: {
				roleAssignment: assignment,
			},
		});
	} catch (error) {
		const pgErrorCode = getPgErrorCode(error);
		if (pgErrorCode === "23505") {
			return res.status(409).json({
<<<<<<< HEAD
				code: ERROR_CODES.already_exists,
				message:
					"This role is already assigned to the user in this organization",
			});
		}
		if (pgErrorCode === "23503") {
			return res.status(400).json({
				code: ERROR_CODES.invalid_related_entity,
				message: "Invalid user, role or organization IDs",
=======
				message:
					"This role is already assigned to the user in this organization.",
			});
		}
		if (pgCode === "23503") {
			return res.status(400).json({
				message: "userId, roleId, or organizationId does not exist.",
>>>>>>> 6e7e8cb (minor cleanup: organizing imports, better practices)
			});
		}

		throw error;
	}
};
