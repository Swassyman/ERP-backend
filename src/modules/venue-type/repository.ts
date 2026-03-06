import { and, asc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/config/db.js";
import { unreachable } from "@/utilities/helpers.js";

export async function getVenueTypes() {
	return await db
		.select({
			id: schema.venueType.id,
			name: schema.venueType.name,
		})
		.from(schema.venueType)
		.where(isNull(schema.venueType.deletedAt))
		.orderBy(schema.venueType.createdAt);
}

export async function insertVenueType(data: { name: string }) {
	const [inserted] = await db
		.insert(schema.venueType)
		.values({ name: data.name })
		.returning({ id: schema.venueType.id });

	if (inserted == null) unreachable();

	return inserted;
}

export async function getVenueTypeRoles(venueTypeId: number) {
	return await db
		.select({
			id: schema.role.id,
			name: schema.role.name,
		})
		.from(schema.role)
		.where(
			and(
				eq(schema.role.managedEntityType, "venue"),
				eq(schema.role.typeRefId, venueTypeId),
				isNull(schema.role.deletedAt),
			),
		)
		.orderBy(asc(schema.role.createdAt));
}

export async function createVenueTypeRole(
	venueTypeId: number,
	data: {
		name: string;
	},
) {
	const [inserted] = await db
		.insert(schema.role)
		.values({
			name: data.name,
			managedEntityType: "venue",
			typeRefId: venueTypeId,
		})
		.returning({ id: schema.role.id });

	if (inserted == null) unreachable();

	return inserted;
}
