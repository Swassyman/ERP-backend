import { isNull } from "drizzle-orm";
import { db, schema } from "@/db/index.js";
import { dbAction, unreachable } from "@/lib/helpers.js";

export async function findFacilities() {
	return await db
		.select({
			id: schema.facility.id,
			name: schema.facility.name,
		})
		.from(schema.facility)
		.where(isNull(schema.facility.deletedAt));
}

export const insertFacility = dbAction(async (data: { name: string }) => {
	const [inserted] = await db
		.insert(schema.facility)
		.values({
			name: data.name,
		})
		.returning({ id: schema.facility.id });

	if (inserted == null) unreachable();

	return inserted;
});
