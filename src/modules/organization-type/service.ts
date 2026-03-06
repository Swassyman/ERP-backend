import * as repository from "./repository.js";
import type {
	AddAllowedParentParamsSchema,
	CreateOrganizationTypeRoleSchema,
	CreateOrganizationTypeSchema,
} from "./schema.js";

export async function getOrganizationTypes() {
	return await repository.getOrganizationTypes();
}

export async function createOrganizationType(
	input: CreateOrganizationTypeSchema,
) {
	return await repository.createOrganizationType({
		name: input.name,
	});
}

export async function getOrganizationTypeChildTypes(
	organizationTypeId: number,
) {
	return await repository.getOrganizationTypeChildrenTypes(organizationTypeId);
}

export async function addAllowedChildType(input: AddAllowedParentParamsSchema) {
	return await repository.addAllowedChildType({
		parentTypeId: input.id,
		childTypeId: input.childId,
	});
}

export async function getOrganizationTypeRoles(organizationId: number) {
	return await repository.getOrganizationTypeRoles(organizationId);
}

export async function createOrganizationTypeRole(
	organizationTypeId: number,
	input: CreateOrganizationTypeRoleSchema,
) {
	return await repository.createOrganizationTypeRole(organizationTypeId, {
		name: input.name,
	});
}
