import { NotFoundError } from "@/lib/errors.js";
import * as repository from "./repository.js";
import type { AddMemberToOrganizationSchema, CreateOrganizationSchema } from "./schema.js";

export async function createOrganization(input: CreateOrganizationSchema) {
	return await repository.createOrganization({
		name: input.name,
		organizationTypeId: input.organizationTypeId,
		parentOrganizationId: input.parentOrganizationId,
	});
}

export async function getOrganizations() {
	return await repository.getOrganizations();
}

export async function getOrganization(organizationId: number) {
	const organization = await repository.getOrganization(organizationId);
	if (organization == null) throw new NotFoundError("Could not find the organization");
	return organization;
}

export async function getOrganizationMembers(organizationId: number) {
	const relatedManagedEntity = await repository.findOrganizationManagedEntity(organizationId);

	if (relatedManagedEntity == null) throw new NotFoundError("Could not find the organization");

	return await repository.getOrganizationMembers(relatedManagedEntity.id);
}

export async function addMemberToOrganization(
	organizationId: number,
	input: AddMemberToOrganizationSchema,
) {
	const relatedManagedEntity = await repository.findOrganizationManagedEntity(organizationId);

	if (relatedManagedEntity == null) throw new NotFoundError("Could not find the organization");

	const newMember = await repository.addOrganizationMember({
		managedEntityId: relatedManagedEntity.id,
		roleId: input.roleId,
		userId: input.userId,
	});

	return newMember;
}
