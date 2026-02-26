import { isNull } from "drizzle-orm";
import type { Request } from "express";
import { z } from "zod";
import { db, schema } from "../config/db.js";
import type { ApiRequestHandler, ApiResponse } from "../config/types.js";
import { INSTITUTION_DOMAIN_REGEXP } from "../constants.js";
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
			success: false,
			code: ERROR_CODES.validation_error,
			message: "Invalid details",
		});
	}

	try {
		const [newUser] = await db
			.insert(schema.user)
			.values({
				type: "end_user",
				email: parsed.data.email,
				passwordHash: await hashPassword(parsed.data.password),
				fullName: parsed.data.fullName,
			})
			.returning({
				id: schema.user.id,
				fullName: schema.user.fullName,
				email: schema.user.email,
				createdAt: schema.user.createdAt,
			});

		if (newUser == null) {
			unreachable();
		}

		return res.status(201).json({
			success: true,
			data: { user: newUser },
		});
	} catch (error) {
		const pgErrorCode = getPgErrorCode(error);
		if (pgErrorCode === "23505") {
			return res.status(409).json({
				success: false,
				code: ERROR_CODES.already_exists,
				message: "A user with this email already exists.",
			});
		}

		throw error;
	}
};

// todo: protection
export const getUsers: ApiRequestHandler<{
	users: {
		email: string;
		fullName: string;
		id: number;
		isActive: boolean;
		createdAt: string;
		roles: {
			id: number;
			isActive: boolean;
			createdAt: string;
			roleId: number;
			managedEntityId: number;
		}[];
	}[];
}> = async (_req, res) => {
	const users = await db.query.user.findMany({
		where: isNull(schema.user.deletedAt),
		columns: {
			id: true,
			fullName: true,
			email: true,
			createdAt: true,
			isActive: true,
		},
		with: {
			roles: {
				columns: {
					id: true,
					isActive: true,
					createdAt: true,
					roleId: true,
					managedEntityId: true,
				},
			},
		},
	});

	return res.status(200).json({
		success: true,
		data: {
			users: users,
		},
	});
};

const createOrganizationSchema = z
	.object({
		name: z
			.string({ error: "Invalid name value" })
			.nonempty({ error: "Name cannot be empty" })
			.max(256, { error: "Name cannot exceed 256 characters" }),
		organizationTypeId: z.int({ error: "Invalid organization type ID" }),
		parentOrganizationId: z
			.int({ error: "Invalid organization ID" })
			.optional(),
	})
	.strict();

export const createOrganization: ApiRequestHandler<{
	organization: {
		id: number;
		name: string;
		type: number;
		parentOrganizationId: number | null;
		createdAt: string;
	};
}> = async (req, res) => {
	const parsed = createOrganizationSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: "Invalid details",
		});
	}

	try {
		const [newOrg] = await db
			.insert(schema.organization)
			.values({
				name: parsed.data.name,
				organizationTypeId: parsed.data.organizationTypeId,
				parentOrganizationId: parsed.data.parentOrganizationId ?? null,
			})
			.returning({
				id: schema.organization.id,
				name: schema.organization.name,
				type: schema.organization.organizationTypeId,
				parentOrganizationId: schema.organization.parentOrganizationId,
				createdAt: schema.organization.createdAt,
			});

		if (newOrg == null) {
			unreachable();
		}

		return res.status(201).json({
			success: true,
			data: {
				organization: newOrg,
			},
		});
	} catch (error) {
		const pgErrorCode = getPgErrorCode(error);
		if (pgErrorCode === "23505") {
			return res.status(409).json({
				success: false,
				code: ERROR_CODES.already_exists,
				message: "An organization with the same name already exists",
			});
		}
		if (pgErrorCode === "23503") {
			return res.status(409).json({
				success: false,
				code: ERROR_CODES.already_exists,
				message: "Invalid parent organization",
			});
		}

		throw error;
	}
};

// todo: protection
export const getOrganizations = async (
	_req: Request,
	res: ApiResponse<{
		organizations: {
			organizationTypeId: number;
			id: number;
			name: string;
			parentOrganizationId: number | null;
			isActive: boolean;
			createdAt: string;
		}[];
	}>,
) => {
	const organizations = await db.query.organization.findMany({
		where: isNull(schema.organization.deletedAt),
		columns: {
			id: true,
			name: true,
			organizationTypeId: true,
			parentOrganizationId: true,
			isActive: true,
			createdAt: true,
		},
	});

	res.status(200).json({
		success: true,
		data: {
			organizations: organizations,
		},
	});
};

const assignRoleSchema = z
	.object({
		userId: z.int({ error: "Invalid user ID" }),
		roleId: z.int({ error: "Invalid role ID" }),
		managedEntityId: z.int({ error: "Invalid managed entity ID" }),
	})
	.strict();

export const assignRole = async (
	req: Request,
	res: ApiResponse<{
		roleAssignment: {
			id: number;
			userId: number;
			roleId: number;
			managedEntityId: number;
			createdAt: string;
		};
	}>,
) => {
	const parsed = assignRoleSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: "Invalid details",
		});
	}

	try {
		const [assignment] = await db
			.insert(schema.userRole)
			.values({
				userId: parsed.data.userId,
				roleId: parsed.data.roleId,
				managedEntityId: parsed.data.managedEntityId,
			})
			.returning({
				id: schema.userRole.id,
				userId: schema.userRole.userId,
				roleId: schema.userRole.roleId,
				managedEntityId: schema.userRole.managedEntityId,
				createdAt: schema.userRole.createdAt,
			});

		if (assignment == null) {
			unreachable();
		}

		return res.status(201).json({
			success: true,
			data: {
				roleAssignment: assignment,
			},
		});
	} catch (error) {
		const pgErrorCode = getPgErrorCode(error);
		if (pgErrorCode === "23505") {
			return res.status(409).json({
				success: false,
				code: ERROR_CODES.already_exists,
				message:
					"This role is already assigned to the user in this organization",
			});
		}
		if (pgErrorCode === "23503") {
			return res.status(400).json({
				success: false,
				code: ERROR_CODES.invalid_related_entity,
				message: "Invalid user, role or organization IDs",
			});
		}

		throw error;
	}
};

export const getRoles = async (
	_req: Request,
	res: ApiResponse<{
		roles: {
			id: number;
			createdAt: string;
			name: string;
		}[];
	}>,
) => {
	const roles = await db.query.role.findMany({
		where: isNull(schema.role.deletedAt),
		columns: {
			id: true,
			name: true,
			createdAt: true,
		},
	});

	res.status(200).json({
		success: true,
		data: {
			roles: roles,
		},
	});
};
