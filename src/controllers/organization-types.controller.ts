import { and, asc, eq, isNull } from "drizzle-orm";
import z from "zod";
import { db, schema } from "../config/db.js";
import type { ApiRequestHandler } from "../config/types.js";
import { ERROR_CODES } from "../utilities/errors.js";
import { unreachable } from "../utilities/helpers.js";

export const getOrganizationTypes: ApiRequestHandler<{
	organizationTypes: {
		id: number;
		name: string;
	}[];
}> = async (_req, res) => {
	const organizationTypes = await db
		.select({
			id: schema.organizationType.id,
			name: schema.organizationType.name,
		})
		.from(schema.organizationType)
		.where(isNull(schema.organizationType.deletedAt))
		.orderBy(schema.organizationType.createdAt);

	return res.status(200).json({
		success: true,
		data: {
			organizationTypes: organizationTypes,
		},
	});
};

const createOrganizationTypeSchema = z
	.object({
		name: z
			.string({ error: "Invalid name type" })
			.trim()
			.nonempty({ error: "Name must not be empty" })
			.max(256, { error: "Name cannot be longer than 256 characters" }),
	})
	.strict();

export const createOrganizationType: ApiRequestHandler<{
	id: number;
}> = async (req, res) => {
	const parsed = createOrganizationTypeSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: parsed.error.message,
		});
	}

	const [inserted] = await db
		.insert(schema.organizationType)
		.values({ name: parsed.data.name })
		.returning({ id: schema.organizationType.id });

	if (inserted == null) {
		unreachable();
	}

	return res.status(200).json({
		success: true,
		data: {
			id: inserted.id,
		},
	});
};

const organizationTypeScopedSchema = z
	.object({
		id: z.coerce.number({ error: "Invalid organization type ID" }),
	})
	.strict();

export const getOrganizationTypeChildTypes: ApiRequestHandler<
	{
		childrenTypes: {
			id: number;
			name: string;
		}[];
	},
	{ id: string }
> = async (req, res) => {
	const parsedParams = organizationTypeScopedSchema.safeParse(req.params);

	if (!parsedParams.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: parsedParams.error.message,
		});
	}

	const organizationTypeChildrenTypes = await db
		.select({
			id: schema.organizationTypeAllowedParent.childTypeId,
			name: schema.organizationType.name,
		})
		.from(schema.organizationTypeAllowedParent)
		.innerJoin(
			schema.organizationType,
			eq(
				schema.organizationTypeAllowedParent.childTypeId,
				schema.organizationType.id,
			),
		)
		.where(
			eq(
				schema.organizationTypeAllowedParent.parentTypeId,
				parsedParams.data.id,
			),
			// note: no need of work
		)
		.orderBy(schema.organizationTypeAllowedParent.createdAt);

	return res.status(200).json({
		success: true,
		data: {
			childrenTypes: organizationTypeChildrenTypes,
		},
	});
};

const addAllowedParentParamsSchema = z
	.object({
		id: z.coerce.number({
			error: "Invalid organization type ID",
		}),
		childId: z.coerce.number({
			error: "Invalid child organization type ID",
		}),
	})
	.strict();

export const addAllowedParent: ApiRequestHandler<
	{
		allowedParent: {
			parentTypeId: number;
			childTypeId: number;
		};
	},
	{ id: string; childid: string }
> = async (req, res) => {
	const parsed = addAllowedParentParamsSchema.safeParse(req.params);

	if (!parsed.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: parsed.error.message,
		});
	}

	const [inserted] = await db
		.insert(schema.organizationTypeAllowedParent)
		.values({
			parentTypeId: parsed.data.id,
			childTypeId: parsed.data.childId,
		})
		.returning({
			parentTypeId: schema.organizationTypeAllowedParent.parentTypeId,
			childTypeId: schema.organizationTypeAllowedParent.childTypeId,
		});

	if (inserted == null) {
		unreachable();
	}

	return res.status(200).json({
		success: true,
		data: {
			allowedParent: {
				parentTypeId: inserted.parentTypeId,
				childTypeId: inserted.childTypeId,
			},
		},
	});
};

export const getOrganizationTypeRoles: ApiRequestHandler<
	{
		roles: {
			id: number;
			name: string;
		}[];
	},
	{ id: string }
> = async (req, res) => {
	const parsedParams = organizationTypeScopedSchema.safeParse(req.params);

	if (!parsedParams.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: parsedParams.error.message,
		});
	}

	const organizationTypeRoles = await db
		.select({
			id: schema.role.id,
			name: schema.role.name,
		})
		.from(schema.role)
		.where(
			and(
				eq(schema.role.managedEntityType, "organization"),
				eq(schema.role.typeRefId, parsedParams.data.id),
				isNull(schema.role.deletedAt),
			),
		)
		.orderBy(asc(schema.role.createdAt));

	return res.status(200).json({
		success: true,
		data: {
			roles: organizationTypeRoles,
		},
	});
};

const createOrganizationTypeRoleSchema = z
	.object({
		name: z
			.string({ error: "Invalid role name" })
			.trim()
			.nonempty({ error: "Name must not be empty" })
			.max(256, { error: "Name cannot be longer than 256 characters" }),
	})
	.strict();

export const createOrganizationTypeRole: ApiRequestHandler<
	{ id: number },
	{ id: string }
> = async (req, res) => {
	const parsedParams = organizationTypeScopedSchema.safeParse(req.params);
	const parsed = createOrganizationTypeRoleSchema.safeParse(req.body);

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

	const [relatedOrgType] = await db
		.select({ id: schema.organizationType.id })
		.from(schema.organizationType)
		.where(
			and(
				isNull(schema.organizationType.deletedAt),
				eq(schema.organizationType.id, parsedParams.data.id),
			),
		)
		.limit(1);

	if (relatedOrgType == null) {
		return res.status(404).json({
			success: false,
			code: ERROR_CODES.not_found,
			message: "Linked organization type not found",
		});
	}

	const [inserted] = await db
		.insert(schema.role)
		.values({
			name: parsed.data.name,
			managedEntityType: "organization",
			typeRefId: parsedParams.data.id,
		})
		.returning({ id: schema.role.id });

	if (inserted == null) {
		unreachable();
	}

	return res.status(200).json({
		success: true,
		data: {
			id: inserted.id,
		},
	});
};
