import { NotFoundError } from "@/utilities/errors.js";
import * as repository from "./repository.js";
import type {
	AddMemberToVenueSchema,
	CreateVenueSchema,
	SetVenueFacilitiesSchema,
} from "./schema.js";

export async function createVenue(input: CreateVenueSchema) {
	return await repository.createVenue({
		name: input.name,
		accessLevel: input.accessLevel,
		isAvailable: input.isAvailable,
		maxCapacity: input.maxCapacity,
		venueTypeId: input.venueTypeId,
		organizationId: input.organizationId,
		unavailabilityReason: input.unavailabilityReason,
	});
}

export async function getVenues() {
	return await repository.getVenues();
}

export async function getVenueMembers(venueId: number) {
	const relatedManagedEntity =
		await repository.findVenueManagedEntity(venueId);

	if (relatedManagedEntity == null)
		throw new NotFoundError("Could not find the venue");

	return await repository.getVenueMembers(relatedManagedEntity.id);
}

export async function addMemberToVenue(
	venueId: number,
	input: AddMemberToVenueSchema,
) {
	const relatedManagedEntity =
		await repository.findVenueManagedEntity(venueId);

	if (relatedManagedEntity == null)
		throw new NotFoundError("Could not find the venue");

	const newMember = await repository.addVenueMember({
		managedEntityId: relatedManagedEntity.id,
		roleId: input.roleId,
		userId: input.userId,
	});

	return newMember;
}

export async function getVenueFacilities(venueId: number) {
	return await repository.getVenueFacilities(venueId);
}
export async function setVenueFacilities(
	venueId: number,
	input: SetVenueFacilitiesSchema,
) {
	if (input.facilityId.length === 0) {
		await repository.deleteAllVenueFacilities(venueId);
		return [];
	}

	return await repository.setVenueFacilities(venueId, {
		facilityIds: input.facilityId,
	});
}
