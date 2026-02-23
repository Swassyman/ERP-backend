import type { Request } from "express";
import { z } from "zod";
import { db } from "../config/db.js";
import { organization, organizationUserRole, user } from "../config/schema.js";
import type { ApiResponse, OrganizationType } from "../config/types.js";
import { INSTITUTION_DOMAIN_REGEXP, ORGANIZATION_TYPES } from "../constants.js";
import { hashPassword } from "../utilities/argon2.js";
import { ERROR_CODES } from "../utilities/errors.js";
import { getPgErrorCode, unreachable } from "../utilities/helpers.js";

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

	try {
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
		const pgErrorCode = getPgErrorCode(error);
		if (pgErrorCode === "23505") {
			return res.status(409).json({
				code: ERROR_CODES.already_exists,
				message: "A user with this email already exists.",
			});
		}

		throw error;
	}
};

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
			.optional(),
	})
	.strict();

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

		if (assignment == null) {
			unreachable();
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
				code: ERROR_CODES.already_exists,
				message:
					"This role is already assigned to the user in this organization",
			});
		}
		if (pgErrorCode === "23503") {
			return res.status(400).json({
				code: ERROR_CODES.invalid_related_entity,
				message: "Invalid user, role or organization IDs",
			});
		}

		throw error;
	}
};
