import { ok } from "@/lib/helpers.js";
import { createEventTypeSchema, deleteEventTypeSchema } from "./schema.js";
import * as service from "./service.js";

export const getEventType: ApiRequestHandler<
	{
		id: number;
		name: string;
	}[]
> = async (_req, res) => {
	const result = await service.getEventTypes();
	return ok(res, result);
};

export const createEventType: ApiRequestHandler<{
	id: number;
}> = async (req, res) => {
	const body = createEventTypeSchema.parse(req.body);
	const result = await service.createEventType(body);
	return ok(res, result);
};

export const deleteEventType: ApiRequestHandler<true> = async (req, res) => {
	const params = deleteEventTypeSchema.parse(req.params);
	await service.deleteEventType(params.id);
	return ok(res, true);
};
