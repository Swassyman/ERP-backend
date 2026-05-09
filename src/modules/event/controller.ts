import { getAuthenticatedUser, ok } from "@/lib/helpers.js";
import * as service from "./service.js";
import {
	createEventSchema,
	eventScopedSchema,
	getEventsQuerySchema,
	updateEventSchema,
} from "./schema.js";

export const createEvent: ApiRequestHandler<{
	id: number;
}> = async (req, res) => {
	const body = createEventSchema.parse(req.body);
	const result = await service.createEvent(body);
	return ok(res, result);
};

export const getEvents: ApiRequestHandler<
	{
		id: number;
		eventTitle: string;
		eventType: string;
		status: EventStatus;
		parentEventId: number | null;
		parentEventTitle: string | null;
		startsAt: string;
		organizers: {
			organizerId: number;
			organizerName: string;
			organizerType: EventOrganizerRole;
		}[];
	}[]
> = async (req, res) => {
	const query = getEventsQuerySchema.parse(req.query);
	const user = getAuthenticatedUser(req);
	const result = await service.getEvents(user, query);
	return ok(res, result);
};

export const updateEvent: ApiRequestHandler<{
	id: number;
}> = async (req, res) => {
	const { id } = eventScopedSchema.parse(req.params);
	const body = updateEventSchema.parse(req.body);
	const result = await service.updateEvent(id, body);
	return ok(res, result);
};
