import { and, eq, isNull, notInArray, sql } from "drizzle-orm";
import { db, schema } from "@/config/db.js";
import { unreachable } from "@/utilities/helpers.js";

export async function createVenue(data: {
	name: string;
	venueTypeId: number;
	maxCapacity: number;
	accessLevel: VenueAccessLevel;
	isAvailable: boolean;
	organizationId?: number | undefined;
	unavailabilityReason?: string | undefined;
}) {
	// todo: replicate the db checks here.
	// e.g.: isAvailable === (unavailabilityReason == null)
	const newVenue = db.$with("new_venue").as(
		db
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
			.returning({ id: schema.venue.id }),
	);
	const [inserted] = await db
		.with(newVenue)
		.insert(schema.managedEntity)
		.values({
			managedEntityType: "venue",
			refId: sql`(select id from ${newVenue})`,
		})
		.returning({ id: newVenue.id });

	if (inserted == null) unreachable();

	return inserted;
}

export async function getVenues() {
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
}

export async function findVenueManagedEntity(venueId: number) {
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
}

export async function getVenueMembers(managedEntityId: number) {
	// todo: do I need to check whether the venue exist? think
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
}

export async function addVenueMember(data: {
	managedEntityId: number;
	userId: number;
	roleId: number;
}) {
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
}

export async function getVenueFacilities(venueId: number) {
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
}

export async function setVenueFacilities(
	venueId: number,
	data: { facilityIds: number[] },
) {
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
						notInArray(
							schema.venueFacility.facilityId,
							data.facilityIds,
						),
					),
				),
		);

	return await db
		.with(upsertCte, deleteCte)
		.select({ facilityId: schema.venueFacility.facilityId })
		.from(schema.venueFacility)
		.where(eq(schema.venueFacility.venueId, venueId));
}

export async function deleteAllVenueFacilities(venueId: number) {
	await db
		.delete(schema.venueFacility)
		.where(eq(schema.venueFacility.venueId, venueId));
}
