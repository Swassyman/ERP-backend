import { and, eq, isNull, sql } from "drizzle-orm";
import z from "zod";
import { db, schema } from "@/config/db.js";
import { VENUE_ACCESS_LEVELS } from "@/config/schema.js";
import { ERROR_CODES } from "@/utilities/errors.js";
import { getPgErrorCode, unreachable } from "@/utilities/helpers.js";

const createVenueSchema = z
	.object({
		name: z
			.string({ error: "Invalid name value" })
			.nonempty({ error: "Name cannot be empty" })
			.max(256, { error: "Name cannot exceed 256 characters" }),
		venueTypeId: z.int({ error: "Invalid venue type ID" }),
		organizationId: z.int({ error: "Invalid organization ID" }).optional(),
		maxCapacity: z
			.int({ error: "Invalid capacity" })
			.positive({ error: "Capacity must be a positive integer" }),
		accessLevel: z.enum(VENUE_ACCESS_LEVELS, {
			error: "Venue must specify its access level",
		}),
		isAvailable: z.boolean({
			error: "Venue must specify whether it is availability",
		}),
		unavailabilityReason: z
			.string({ error: "Invalid unavailability reason" })
			.nonempty({ error: "Invalid unavailability reason" })
			.max(512, { error: "Invalid unavailability reason" })
			.optional(),
	})
	.refine(
		(venue) =>
			(venue.isAvailable && venue.unavailabilityReason == null) ||
			(!venue.isAvailable && venue.unavailabilityReason != null),
		{
			error: "Venue must have reason for its unavailability if marked unavailable",
		},
	)
	.strict();

export const createVenue: ApiRequestHandler<{
	venue: {
		id: number;
	};
}> = async (req, res) => {
	const parsed = createVenueSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: "Invalid details",
		});
	}

	try {
		const newVenue = await db.transaction(async (tx) => {
			const [newVenue] = await tx
				.insert(schema.venue)
				.values({
					name: parsed.data.name,
					venueTypeId: parsed.data.venueTypeId,
					organizationId: parsed.data.organizationId,
					accessLevel: parsed.data.accessLevel,
					isAvailable: parsed.data.isAvailable,
					unavailabilityReason: parsed.data.unavailabilityReason,
					maxCapacity: parsed.data.maxCapacity,
				})
				.returning({ id: schema.venue.id });

			if (newVenue == null) {
				tx.rollback();
				return null;
			}

			// note: just as important as inserting an venue
			await tx.insert(schema.managedEntity).values({
				managedEntityType: "venue",
				refId: newVenue.id,
			});

			return newVenue;
		});

		if (newVenue == null) {
			unreachable();
		}

		return res.status(201).json({
			success: true,
			data: {
				venue: newVenue,
			},
		});
	} catch (error) {
		const pgErrorCode = getPgErrorCode(error);
		if (pgErrorCode === "23505") {
			return res.status(409).json({
				success: false,
				code: ERROR_CODES.already_exists,
				message: "An venue with the same name already exists",
			});
		}
		if (pgErrorCode === "23503") {
			return res.status(409).json({
				success: false,
				code: ERROR_CODES.validation_error,
				message: "Invalid owner organization",
			});
		}

		throw error;
	}
};

export const getVenues: ApiRequestHandler<{
	venues: {
		name: string;
		venueTypeId: number;
		organizationId: number | null;
		maxCapacity: number;
		accessLevel: VenueAccessLevel;
		isAvailable: boolean;
		unavailabilityReason: string | null;
		id: number;
		isActive: boolean;
	}[];
}> = async (_req, res) => {
	const venues = await db.query.venue.findMany({
		where: isNull(schema.venue.deletedAt),
		columns: {
			id: true,
			name: true,
			accessLevel: true,
			isAvailable: true,
			maxCapacity: true,
			organizationId: true,
			unavailabilityReason: true,
			venueTypeId: true,
			isActive: true,
		},
	});

	res.status(200).json({
		success: true,
		data: {
			venues: venues,
		},
	});
};

const venueScopedSchema = z
	.object({
		id: z.coerce
			.number({ error: "Invalid venue ID" })
			.int({ error: "Invalid venue ID" }),
	})
	.strict();

export const getVenueMembers: ApiRequestHandler<
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
	const parsedParams = venueScopedSchema.safeParse(req.params);

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
				eq(schema.managedEntity.managedEntityType, "venue"),
				eq(schema.managedEntity.refId, parsedParams.data.id),
				isNull(schema.managedEntity.deletedAt),
			),
		)
		.limit(1);

	if (relatedManagedEntity == null) {
		return res.status(404).json({
			success: false,
			code: ERROR_CODES.not_found,
			message: "Linked venue not found",
		});
	}

	const venueMembers = await db.query.userRole.findMany({
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
			members: venueMembers,
		},
	});
};

const addMemberToVenueSchema = z.object({
	userId: z.coerce
		.number({ error: "Invalid user ID" })
		.int({ error: "Invalid user ID" }),
	roleId: z.coerce
		.number({ error: "Invalid role ID" })
		.int({ error: "Invalid role ID" }),
});

export const addMemberToVenue: ApiRequestHandler<
	{ memberId: number },
	{ id: string },
	z.infer<typeof addMemberToVenueSchema> // todo: add this everywhere concerned
> = async (req, res) => {
	const parsedParams = venueScopedSchema.safeParse(req.params);
	const parsed = addMemberToVenueSchema.safeParse(req.body);

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
				eq(schema.managedEntity.managedEntityType, "venue"),
				eq(schema.managedEntity.refId, parsedParams.data.id),
				isNull(schema.managedEntity.deletedAt),
			),
		)
		.limit(1);

	if (relatedManagedEntity == null) {
		return res.status(404).json({
			success: false,
			code: ERROR_CODES.not_found,
			message: "Linked venue not found",
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

export const getVenueFacilities: ApiRequestHandler<
	{
		id: number;
		facilityId: number;
		facilityName: string;
	}[],
	{ id: string }
> = async (req, res) => {
	const parsedParams = venueScopedSchema.safeParse(req.params);

	if (!parsedParams.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: parsedParams.error.message,
		});
	}

	const facilities = await db
		.select({
			id: schema.venueFacility.id,
			facilityId: schema.facility.id,
			facilityName: schema.facility.name,
		})
		.from(schema.venueFacility)
		.innerJoin(
			schema.facility,
			eq(schema.venueFacility.facilityId, schema.facility.id),
		);

	return res.status(200).json({
		success: true,
		data: facilities,
	});
};

const assignFacilityToVenueSchema = z.object({
	id: z.coerce.number({
		error: "Invalid venue ID",
	}),
	facilityId: z.coerce.number({
		error: "Invalid facility ID",
	}),
});

export const assignFacilityToVenue: ApiRequestHandler<
	{ id: number },
	{ id: string; facilityId: string }
> = async (req, res) => {
	const parsedParams = assignFacilityToVenueSchema.safeParse(req.params);

	if (!parsedParams.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: parsedParams.error.message,
		});
	}

	const [inserted] = await db
		.insert(schema.venueFacility)
		.values({
			venueId: parsedParams.data.id,
			facilityId: parsedParams.data.facilityId,
		})
		.returning({ id: schema.venueFacility.id });

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

export const unassignFacilityToVenue: ApiRequestHandler<
	{ id: number },
	{ id: string; facilityId: string }
> = async (req, res) => {
	const parsedParams = assignFacilityToVenueSchema.safeParse(req.params);

	if (!parsedParams.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: parsedParams.error.message,
		});
	}

	const [inserted] = await db
		.update(schema.venueFacility)
		.set({ deletedAt: sql`now()` })
		.where(
			and(
				eq(
					schema.venueFacility.facilityId,
					parsedParams.data.facilityId,
				),
				eq(schema.venueFacility.venueId, parsedParams.data.id),
				isNull(schema.venueFacility.deletedAt),
			),
		)
		.returning({ id: schema.venueFacility.id });

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
