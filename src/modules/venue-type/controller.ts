import { asyncHandler } from "@/utilities/async-handler.js";
import { ok } from "@/utilities/helpers.js";
import {
	createVenueTypeRoleSchema,
	createVenueTypeSchema,
	venueTypeScopedSchema,
} from "./schema.js";
import * as service from "./service.js";

export const getVenueTypes = asyncHandler<
	{
		id: number;
		name: string;
	}[]
>(async (_req, res) => {
	const result = await service.getVenueTypes();
	return ok(res, result);
});

export const createVenueType = asyncHandler<{
	id: number;
}>(async (req, res) => {
	const body = createVenueTypeSchema.parse(req.body);
	const result = await service.createVenueType(body);
	return ok(res, result);
});

export const getVenueTypeRoles = asyncHandler<
	{
		id: number;
		name: string;
	}[]
>(async (req, res) => {
	const params = venueTypeScopedSchema.parse(req.params);
	const result = await service.getVenueTypeRoles(params.id);
	return ok(res, result);
});

export const createVenueTypeRole = asyncHandler<{ id: number }>(
	async (req, res) => {
		const params = venueTypeScopedSchema.parse(req.params);
		const body = createVenueTypeRoleSchema.parse(req.body);
		const result = await service.createVenueTypeRole(params.id, body);
		return ok(res, result);
	},
);
