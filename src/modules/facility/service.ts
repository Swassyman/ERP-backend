import { db, schema } from "@/db/index.js";
import { unreachable } from "@/utilities/helpers.js";
import * as repository from "./repository.js";
import type { CreateFacilitySchema } from "./schema.js";

export async function getFacilities() {
	const facilities = await repository.findFacilities();
	return facilities;
}

export async function createFacility(input: CreateFacilitySchema) {
	const [inserted] = await db
		.insert(schema.facility)
		.values({
			name: input.name,
		})
		.returning({ id: schema.facility.id });

	if (inserted == null) unreachable();

	return inserted;
}
