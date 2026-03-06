import { asyncHandler } from "@/utilities/async-handler.js";
import { ok } from "@/utilities/helpers.js";
import {
	addMemberToOrganizationSchema,
	createOrganizationSchema,
	organizationScopedSchema,
} from "./schema.js";
import * as service from "./service.js";

export const createOrganization = asyncHandler<{
	id: number;
}>(async (req, res) => {
	const body = createOrganizationSchema.parse(req.body);
	// todo: handle problems with unique and foregin constraints
	const result = await service.createOrganization(body);
	return ok(res, result, 201);
});

export const getOrganizations = asyncHandler<
	{
		organizationTypeId: number;
		id: number;
		name: string;
		parentOrganizationId: number | null;
		isActive: boolean;
	}[]
>(async (_req, res) => {
	const result = await service.getOrganizations();
	return ok(res, result);
});

export const getOrganizationMembers = asyncHandler<
	{
		id: number;
		isActive: boolean;
		roleId: number;
		user: {
			id: number;
			fullName: string;
			email: string;
		};
	}[]
>(async (req, res) => {
	const params = organizationScopedSchema.parse(req.params);
	const result = await service.getOrganizationMembers(params.id);
	return ok(res, result);
});

export const addMemberToOrganization = asyncHandler<{ id: number }>(
	async (req, res) => {
		const params = organizationScopedSchema.parse(req.params);
		const body = addMemberToOrganizationSchema.parse(req.body);
		const result = await service.addMemberToOrganization(params.id, body);
		return ok(res, result);
	},
);
