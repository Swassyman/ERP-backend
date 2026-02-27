import { isNull } from "drizzle-orm";
import z from "zod";
import { db, schema } from "../config/db.js";
import type { ApiRequestHandler } from "../config/types.js";
import { ERROR_CODES } from "../utilities/errors.js";
import { unreachable } from "../utilities/helpers.js";

export const getOrganizationTypes: ApiRequestHandler<{
	organizationTypes: {
		id: number;
		name: string;
		children: {
			childTypeId: number;
		}[];
	}[];
}> = async (_req, res) => {
	const organizationTypes = await db.query.organizationType.findMany({
		where: isNull(schema.organizationType.deletedAt),
		columns: {
			id: true,
			name: true,
			// createdAt: true,
		},
		with: {
			children: {
				columns: {
					childTypeId: true,
					// createdAt: true,
				},
				orderBy: schema.organizationTypeAllowedParent.createdAt,
			},
		},
		orderBy: schema.organizationType.createdAt,
	});

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
	name: string;
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
			name: parsed.data.name,
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

// todo: delete (soft) organization type
// todo: delete parent-child organization type relations
// todo: get parents for a organization type
// todo: get children for a organization type
