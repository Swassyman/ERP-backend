import { and, eq, isNull, notInArray } from "drizzle-orm";
import { db, schema } from "@/db/index.js";
import { dbAction, unreachable } from "@/lib/helpers.js";

export const createVenue = dbAction(
	async (data: {
		name: string;
		venueTypeId: number;
		maxCapacity: number;
		accessLevel: VenueAccessLevel;
		isAvailable: boolean;
		organizationId?: number | null | undefined;
		unavailabilityReason?: string | undefined;
	}) => {
		const [inserted] = await db
			.insert(schema.venue)
			.values({
				name: data.name,
				venueTypeId: data.venueTypeId,
				organizationId: data.organizationId,
				accessLevel: data.accessLevel,
				isAvailable: data.isAvailable,
				unavailabilityReason: data.unavailabilityReason,
				maxCapacity: data.maxCapacity,
			})
			.returning({ id: schema.venue.id });

		if (inserted == null) unreachable();

		return inserted;
	},
);

export const getVenues = dbAction(async () => {
	return await db.query.venue.findMany({
		where: isNull(schema.venue.deletedAt),
		columns: {
			id: true,
			name: true,
			accessLevel: true,
			isAvailable: true,
			unavailabilityReason: true,
			maxCapacity: true,
			organizationId: true,
			venueTypeId: true,
			isActive: true,
		},
	});
});

export const findVenueManagedEntity = dbAction(async (venueId: number) => {
	const [relatedManagedEntity] = await db
		.select({ id: schema.managedEntity.id })
		.from(schema.managedEntity)
		.where(
			and(
				eq(schema.managedEntity.managedEntityType, "venue"),
				eq(schema.managedEntity.refId, venueId),
				isNull(schema.managedEntity.deletedAt),
			),
		)
		.limit(1);

	return relatedManagedEntity;
});

export const getVenueMembers = dbAction(async (managedEntityId: number) => {
	return await db.query.userRole.findMany({
		where: and(
			eq(schema.userRole.managedEntityId, managedEntityId),
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
});

export const addVenueMember = dbAction(
	async (data: { managedEntityId: number; userId: number; roleId: number }) => {
		const [inserted] = await db
			.insert(schema.userRole)
			.values({
				managedEntityId: data.managedEntityId,
				userId: data.userId,
				roleId: data.roleId,
			})
			.returning({ id: schema.userRole.id });

		if (inserted == null) unreachable();

		return inserted;
	},
);

export const getVenueFacilities = dbAction(async (venueId: number) => {
	return await db
		.select({
			id: schema.venueFacility.id,
			facilityId: schema.facility.id,
			facilityName: schema.facility.name,
		})
		.from(schema.venueFacility)
		.innerJoin(
			schema.facility,
			eq(schema.venueFacility.facilityId, schema.facility.id),
		)
		.where(eq(schema.venueFacility.venueId, venueId));
});

export const setVenueFacilities = dbAction(
	async (venueId: number, data: { facilityIds: number[] }) => {
		const upsertCte = db.$with("upsert").as(
			db
				.insert(schema.venueFacility)
				.values(
					data.facilityIds.map(
						(facilityId) =>
							({
								venueId: venueId,
								facilityId: facilityId,
							}) satisfies typeof schema.venueFacility.$inferInsert,
					),
				)
				.onConflictDoNothing({
					target: [
						schema.venueFacility.venueId,
						schema.venueFacility.facilityId,
					],
				})
				.returning({ id: schema.venueFacility.id }),
		);

		const deleteCte = db
			.$with("delete")
			.as(
				db
					.delete(schema.venueFacility)
					.where(
						and(
							eq(schema.venueFacility.venueId, venueId),
							notInArray(schema.venueFacility.facilityId, data.facilityIds),
						),
					),
			);

		return await db
			.with(upsertCte, deleteCte)
			.select({ facilityId: schema.venueFacility.facilityId })
			.from(schema.venueFacility)
			.where(eq(schema.venueFacility.venueId, venueId));
	},
);

export const deleteAllVenueFacilities = dbAction(async (venueId: number) => {
	await db
		.delete(schema.venueFacility)
		.where(eq(schema.venueFacility.venueId, venueId));
});
