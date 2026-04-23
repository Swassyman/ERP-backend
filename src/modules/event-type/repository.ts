import { db, schema } from "@/db/index.js";
import { dbAction, unreachable } from "@/lib/helpers.js";
import { eq, isNull, sql, and } from "drizzle-orm";

export const getEventTypes = dbAction(async () => {
	return await db
		.select({
			id: schema.eventType.id,
			name: schema.eventType.name,
		})
		.from(schema.eventType)
		.where(isNull(schema.eventType.deletedAt))
		.orderBy(schema.eventType.createdAt);
});

export const createEventType = dbAction(async (data: { name: string }) => {
	const [inserted] = await db
		.insert(schema.eventType)
		.values({ name: data.name })
		.returning({ id: schema.eventType.id });

	if (inserted == null) unreachable();

	return inserted;
});

export const findEventType = dbAction(async (id: number) => {
	const [found] = await db
		.select({ val: sql`1` })
		.from(schema.eventType)
		.where(and(eq(schema.eventType.id, id), isNull(schema.eventType.deletedAt)))
		.limit(1);
	return found != null;
});

export const deleteEventType = dbAction(async (id: number) => {
	await db
		.update(schema.eventType)
		.set({ deletedAt: sql`NOW()` })
		.where(and(eq(schema.eventType.id, id), isNull(schema.eventType.deletedAt)));
});

export const getEventTypeChildTypes = dbAction(async (parentEventId: number) => {
	return await db
		.select({ id: schema.eventTypeAllowedParent.childTypeId, name: schema.eventType.name })
		.from(schema.eventTypeAllowedParent)
		.innerJoin(schema.eventType, eq(schema.eventTypeAllowedParent.childTypeId, schema.eventType.id))
		.where(eq(schema.eventTypeAllowedParent.parentTypeId, parentEventId))
		.orderBy(schema.eventTypeAllowedParent.createdAt);
});

export const addAllowedChildtype = dbAction(
	async (data: { parentTypeId: number; childTypeId: number }) => {
		const [inserted] = await db
			.insert(schema.eventTypeAllowedParent)
			.values({
				parentTypeId: data.parentTypeId,
				childTypeId: data.childTypeId,
			})
			.returning({
				parentTypeId: schema.eventTypeAllowedParent.parentTypeId,
				childTypeId: schema.eventTypeAllowedParent.childTypeId,
			});

		if (inserted == null) return unreachable();

		return inserted;
	},
);

export const removeAllowedChildType = dbAction(
	async (data: { parentTypeId: number; childTypeId: number }) => {
		await db
			.delete(schema.eventTypeAllowedParent)
			.where(
				and(
					eq(schema.eventTypeAllowedParent.parentTypeId, data.parentTypeId),
					eq(schema.eventTypeAllowedParent.childTypeId, data.childTypeId),
				),
			);
	},
);
