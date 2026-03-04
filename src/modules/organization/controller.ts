import { and, eq, isNull } from "drizzle-orm";
import z from "zod";
import { db, schema } from "../../config/db.js";
import type { ApiRequestHandler } from "../../config/types.js";
import { ERROR_CODES } from "../../utilities/errors.js";
import { getPgErrorCode, unreachable } from "../../utilities/helpers.js";

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
		organizationTypeId: number;
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
		const newOrg = await db.transaction(async (tx) => {
			const [newOrg] = await tx
				.insert(schema.organization)
				.values({
					name: parsed.data.name,
					organizationTypeId: parsed.data.organizationTypeId,
					parentOrganizationId:
						parsed.data.parentOrganizationId ?? null,
				})
				.returning({
					id: schema.organization.id,
					name: schema.organization.name,
					organizationTypeId: schema.organization.organizationTypeId,
					parentOrganizationId:
						schema.organization.parentOrganizationId,
					createdAt: schema.organization.createdAt,
				});

			if (newOrg == null) {
				tx.rollback();
				return null;
			}

			// note: just as important as inserting an organization
			await tx.insert(schema.managedEntity).values({
				managedEntityType: "organization",
				refId: newOrg.id,
			});

			return newOrg;
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
				code: ERROR_CODES.validation_error,
				message: "Invalid parent organization",
			});
		}

		throw error;
	}
};

export const getOrganizations: ApiRequestHandler<{
	organizations: {
		organizationTypeId: number;
		id: number;
		name: string;
		parentOrganizationId: number | null;
		isActive: boolean;
		createdAt: string;
	}[];
}> = async (_req, res) => {
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

const organizationScopedSchema = z
	.object({
		id: z.coerce
			.number({ error: "Invalid organization ID" })
			.int({ error: "Invalid organization ID" }),
	})
	.strict();

export const getOrganizationMembers: ApiRequestHandler<
	{
		members: {
			id: number;
			isActive: boolean;
			roleId: number;
			user: {
				id: number;
				fullName: string;
				email: string;
			};
		}[];
	},
	{ id: string }
> = async (req, res) => {
	// todo: extract zod parsing into middleware
	const parsedParams = organizationScopedSchema.safeParse(req.params);

	if (!parsedParams.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: parsedParams.error.message,
		});
	}

	const [relatedManagedEntity] = await db
		.select({ id: schema.managedEntity.id })
		.from(schema.managedEntity)
		.where(
			and(
				eq(schema.managedEntity.managedEntityType, "organization"),
				eq(schema.managedEntity.refId, parsedParams.data.id),
				isNull(schema.managedEntity.deletedAt),
			),
		)
		.limit(1);

	if (relatedManagedEntity == null) {
		return res.status(404).json({
			success: false,
			code: ERROR_CODES.not_found,
			message: "Linked organization not found",
		});
	}

	const organizationMembers = await db.query.userRole.findMany({
		where: and(
			eq(schema.userRole.managedEntityId, relatedManagedEntity.id),
			isNull(schema.userRole.deletedAt),
		),
		columns: {
			id: true,
			isActive: true,
			roleId: true,
		},
		with: {
			user: {
				columns: {
					id: true,
					fullName: true,
					email: true,
				},
			},
		},
	});

	return res.status(200).json({
		success: true,
		data: {
			members: organizationMembers,
		},
	});
};

const addMemberToOrganizationSchema = z.object({
	userId: z.coerce
		.number({ error: "Invalid user ID" })
		.int({ error: "Invalid user ID" }),
	roleId: z.coerce
		.number({ error: "Invalid role ID" })
		.int({ error: "Invalid role ID" }),
});

export const addMemberToOrganization: ApiRequestHandler<
	{ memberId: number },
	{ id: string },
	z.infer<typeof addMemberToOrganizationSchema> // todo: add this everywhere concerned
> = async (req, res) => {
	const parsedParams = organizationScopedSchema.safeParse(req.params);
	const parsed = addMemberToOrganizationSchema.safeParse(req.body);

	if (!parsedParams.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: parsedParams.error.message,
		});
	}
	if (!parsed.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: parsed.error.message,
		});
	}

	const [relatedManagedEntity] = await db
		.select({ id: schema.managedEntity.id })
		.from(schema.managedEntity)
		.where(
			and(
				eq(schema.managedEntity.managedEntityType, "organization"),
				eq(schema.managedEntity.refId, parsedParams.data.id),
				isNull(schema.managedEntity.deletedAt),
			),
		)
		.limit(1);

	if (relatedManagedEntity == null) {
		return res.status(404).json({
			success: false,
			code: ERROR_CODES.not_found,
			message: "Linked organization not found",
		});
	}

	const [inserted] = await db
		.insert(schema.userRole)
		.values({
			roleId: parsed.data.roleId,
			userId: parsed.data.userId,
			managedEntityId: parsedParams.data.id,
		})
		.returning({ id: schema.userRole.id });

	if (inserted == null) {
		unreachable();
	}

	return res.status(200).json({
		success: true,
		data: {
			memberId: inserted.id,
		},
	});
};
