import { NotFoundError } from "@/lib/errors.js";
import * as repository from "./repository.js";
import type { CreateVenueTypeRoleSchema, CreateVenueTypeSchema } from "./schema.js";

export async function getVenueTypes() {
	return await repository.getVenueTypes();
}

export async function getVenueType(venueTypeId: number) {
	const venueType = await repository.getVenueType(venueTypeId);
	if (venueType == null) throw new NotFoundError("Could not find the venue type");
	return venueType;
}

export async function createVenueType(input: CreateVenueTypeSchema) {
	return await repository.insertVenueType(input);
}

export async function getVenueTypeRoles(venueTypeId: number) {
	return await repository.getVenueTypeRoles(venueTypeId);
}

export async function createVenueTypeRole(venueTypeId: number, input: CreateVenueTypeRoleSchema) {
	return await repository.createVenueTypeRole(venueTypeId, {
		name: input.name,
	});
}
