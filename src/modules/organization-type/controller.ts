import { ok } from "@/lib/helpers.js";
import {
	addAllowedParentParamsSchema,
	createOrganizationTypeRoleSchema,
	createOrganizationTypeSchema,
	organizationTypeScopedSchema,
} from "./schema.js";
import * as service from "./service.js";

export const getOrganizationTypes: ApiRequestHandler<
	{
		id: number;
		name: string;
	}[]
> = async (_req, res) => {
	const result = await service.getOrganizationTypes();
	return ok(res, result);
};

export const createOrganizationType: ApiRequestHandler<{
	id: number;
}> = async (req, res) => {
	const body = createOrganizationTypeSchema.parse(req.body);
	const result = await service.createOrganizationType(body);
	return ok(res, result);
};

export const getOrganizationTypeChildTypes: ApiRequestHandler<
	{
		id: number;
		name: string;
	}[]
> = async (req, res) => {
	const params = organizationTypeScopedSchema.parse(req.params);
	const result = await service.getOrganizationTypeChildTypes(params.id);
	return ok(res, result);
};

export const addAllowedChildType: ApiRequestHandler<{
	parentTypeId: number;
	childTypeId: number;
}> = async (req, res) => {
	const params = addAllowedParentParamsSchema.parse(req.params);
	const result = await service.addAllowedChildType(params);
	return ok(res, result);
};

export const getOrganizationTypeRoles: ApiRequestHandler<
	{
		id: number;
		name: string;
	}[]
> = async (req, res) => {
	const params = organizationTypeScopedSchema.parse(req.params);
	const result = await service.getOrganizationTypeRoles(params.id);
	return ok(res, result);
};

export const createOrganizationTypeRole: ApiRequestHandler<{
	id: number;
}> = async (req, res) => {
	const params = organizationTypeScopedSchema.parse(req.params);
	const body = createOrganizationTypeRoleSchema.parse(req.body);

	const result = await service.createOrganizationTypeRole(params.id, body);
	return ok(res, result);
};
