import { and, asc, eq, isNull } from "drizzle-orm";
import z from "zod";
import { db, schema } from "@/config/db.js";
import { ERROR_CODES } from "@/utilities/errors.js";
import { unreachable } from "@/utilities/helpers.js";

export const getVenueTypes: ApiRequestHandler<{
	venueTypes: {
		id: number;
		name: string;
	}[];
}> = async (_req, res) => {
	const venueTypes = await db
		.select({
			id: schema.venueType.id,
			name: schema.venueType.name,
		})
		.from(schema.venueType)
		.where(isNull(schema.venueType.deletedAt))
		.orderBy(schema.venueType.createdAt);

	return res.status(200).json({
		success: true,
		data: {
			venueTypes: venueTypes,
		},
	});
};

const createVenueTypeSchema = z
	.object({
		name: z
			.string({ error: "Invalid name type" })
			.trim() // do this everywhere
			.nonempty({ error: "Name must not be empty" })
			.max(256, { error: "Name cannot be longer than 256 characters" }),
	})
	.strict();

export const createVenueType: ApiRequestHandler<{
	id: number;
}> = async (req, res) => {
	const parsed = createVenueTypeSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: parsed.error.message,
		});
	}

	const [inserted] = await db
		.insert(schema.venueType)
		.values({ name: parsed.data.name })
		.returning({ id: schema.venueType.id });

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

const venueTypeScopedSchema = z
	.object({
		id: z.coerce.number({ error: "Invalid venue type ID" }),
	})
	.strict();

export const getVenueTypeRoles: ApiRequestHandler<
	{
		roles: {
			id: number;
			name: string;
		}[];
	},
	{ id: string }
> = async (req, res) => {
	const parsedParams = venueTypeScopedSchema.safeParse(req.params);

	if (!parsedParams.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: parsedParams.error.message,
		});
	}

	const venueTypeRoles = await db
		.select({
			id: schema.role.id,
			name: schema.role.name,
		})
		.from(schema.role)
		.where(
			and(
				eq(schema.role.managedEntityType, "venue"),
				eq(schema.role.typeRefId, parsedParams.data.id),
				isNull(schema.role.deletedAt),
			),
		)
		.orderBy(asc(schema.role.createdAt));

	return res.status(200).json({
		success: true,
		data: {
			roles: venueTypeRoles,
		},
	});
};

const createVenueTypeRoleSchema = z
	.object({
		name: z
			.string({ error: "Invalid role name" })
			.trim()
			.nonempty({ error: "Name must not be empty" })
			.max(256, { error: "Name cannot be longer than 256 characters" }),
	})
	.strict();

export const createVenueTypeRole: ApiRequestHandler<
	{ id: number },
	{ id: string }
> = async (req, res) => {
	const parsedParams = venueTypeScopedSchema.safeParse(req.params);
	const parsed = createVenueTypeRoleSchema.safeParse(req.body);

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

	const [relatedVenueType] = await db
		.select({ id: schema.venueType.id })
		.from(schema.venueType)
		.where(
			and(
				isNull(schema.venueType.deletedAt),
				eq(schema.venueType.id, parsedParams.data.id),
			),
		)
		.limit(1);

	if (relatedVenueType == null) {
		return res.status(404).json({
			success: false,
			code: ERROR_CODES.not_found,
			message: "Linked venue type not found",
		});
	}

	const [inserted] = await db
		.insert(schema.role)
		.values({
			name: parsed.data.name,
			managedEntityType: "venue",
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
