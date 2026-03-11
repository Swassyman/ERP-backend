import { and, asc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db/index.js";
import { dbAction, unreachable } from "@/lib/helpers.js";

export const getVenueTypes = dbAction(async () => {
	return await db
		.select({
			id: schema.venueType.id,
			name: schema.venueType.name,
		})
		.from(schema.venueType)
		.where(isNull(schema.venueType.deletedAt))
		.orderBy(schema.venueType.createdAt);
});

export const insertVenueType = dbAction(async (data: { name: string }) => {
	const [inserted] = await db
		.insert(schema.venueType)
		.values({ name: data.name })
		.returning({ id: schema.venueType.id });

	if (inserted == null) unreachable();

	return inserted;
});

export const getVenueTypeRoles = dbAction(async (venueTypeId: number) => {
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
});

export const createVenueTypeRole = dbAction(
	async (
		venueTypeId: number,
		data: {
			name: string;
		},
	) => {
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
	},
);
