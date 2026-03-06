import { isNull } from "drizzle-orm";
import { db, schema } from "@/config/db.js";
import { unreachable } from "@/utilities/helpers.js";

export async function findFacilities() {
	return await db
		.select({
			id: schema.facility.id,
			name: schema.facility.name,
		})
		.from(schema.facility)
		.where(isNull(schema.facility.deletedAt));
}

export async function insertFacility(data: { name: string }) {
	const [inserted] = await db
		.insert(schema.facility)
		.values({
			name: data.name,
		})
		.returning({ id: schema.facility.id });

	if (inserted == null) unreachable();

	return inserted;
}
