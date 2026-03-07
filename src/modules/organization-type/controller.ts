import { asyncHandler } from "@/lib/async-handler.js";
import { ok } from "@/lib/helpers.js";
import {
	addAllowedParentParamsSchema,
	createOrganizationTypeRoleSchema,
	createOrganizationTypeSchema,
	organizationTypeScopedSchema,
} from "./schema.js";
import * as service from "./service.js";

export const getOrganizationTypes = asyncHandler<
	{
		id: number;
		name: string;
	}[]
>(async (_req, res) => {
	const result = await service.getOrganizationTypes();
	return ok(res, result);
});

export const createOrganizationType = asyncHandler<{
	id: number;
}>(async (req, res) => {
	const body = createOrganizationTypeSchema.parse(req.body);
	const result = await service.createOrganizationType(body);
	return ok(res, result);
});

export const getOrganizationTypeChildTypes = asyncHandler<
	{
		id: number;
		name: string;
	}[]
>(async (req, res) => {
	const params = organizationTypeScopedSchema.parse(req.params);
	const result = await service.getOrganizationTypeChildTypes(params.id);
	return ok(res, result);
});

export const addAllowedChildType = asyncHandler<{
	parentTypeId: number;
	childTypeId: number;
}>(async (req, res) => {
	const params = addAllowedParentParamsSchema.parse(req.params);
	const result = await service.addAllowedChildType(params);
	return ok(res, result);
});

export const getOrganizationTypeRoles = asyncHandler<
	{
		id: number;
		name: string;
	}[]
>(async (req, res) => {
	const params = organizationTypeScopedSchema.parse(req.params);
	const result = await service.getOrganizationTypeRoles(params.id);
	return ok(res, result);
});

export const createOrganizationTypeRole = asyncHandler<{
	id: number;
}>(async (req, res) => {
	const params = organizationTypeScopedSchema.parse(req.params);
	const body = createOrganizationTypeRoleSchema.parse(req.body);

	const result = await service.createOrganizationTypeRole(params.id, body);
	return ok(res, result);
});
