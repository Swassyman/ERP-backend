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
