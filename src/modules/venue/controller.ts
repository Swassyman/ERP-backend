import { ok } from "@/lib/helpers.js";
import {
	addMemberToVenueSchema,
	createVenueSchema,
	setVenueFacilitiesSchema,
	venueScopedSchema,
} from "./schema.js";
import * as service from "./service.js";

export const createVenue: ApiRequestHandler<{
	id: number;
}> = async (req, res) => {
	const body = createVenueSchema.parse(req.body);
	const result = await service.createVenue(body);
	return ok(res, result, 201);
};

export const getVenues: ApiRequestHandler<
	{
		name: string;
		venueTypeId: number;
		organizationId: number | null;
		maxCapacity: number;
		accessLevel: VenueAccessLevel;
		isAvailable: boolean;
		unavailabilityReason: string | null;
		id: number;
		isActive: boolean;
	}[]
> = async (_req, res) => {
	const result = await service.getVenues();
	return ok(res, result);
};

export const getVenue: ApiRequestHandler<{
	name: string;
	venueTypeId: number;
	organizationId: number | null;
	maxCapacity: number;
	accessLevel: VenueAccessLevel;
	isAvailable: boolean;
	unavailabilityReason: string | null;
	id: number;
	createdAt: string;
	isActive: boolean;
}> = async (req, res) => {
	const params = venueScopedSchema.parse(req.params);
	const result = await service.getVenue(params.id);
	return ok(res, result);
};

export const getVenueMembers: ApiRequestHandler<
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
> = async (req, res) => {
	const params = venueScopedSchema.parse(req.params);
	const result = await service.getVenueMembers(params.id);
	return ok(res, result);
};

export const addMemberToVenue: ApiRequestHandler<{ id: number }> = async (req, res) => {
	const params = venueScopedSchema.parse(req.params);
	const body = addMemberToVenueSchema.parse(req.body);
	const result = await service.addMemberToVenue(params.id, body);
	return ok(res, result);
};

export const getVenueFacilities: ApiRequestHandler<
	{
		id: number;
		facilityId: number;
		facilityName: string;
	}[]
> = async (req, res) => {
	const params = venueScopedSchema.parse(req.params);
	const result = await service.getVenueFacilities(params.id);
	return ok(res, result);
};

export const setVenueFacilities: ApiRequestHandler<{ facilityId: number }[]> = async (req, res) => {
	const params = venueScopedSchema.parse(req.params);
	const body = setVenueFacilitiesSchema.parse(req.body);
	const result = await service.setVenueFacilities(params.id, body);
	return ok(res, result);
};
