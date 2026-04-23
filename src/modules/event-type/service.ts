import { NotFoundError } from "@/lib/errors.js";
import * as repository from "./repository.js";
import type { CreateEventTypeSchema } from "./schema.js";

export async function getEventTypes() {
	return await repository.getEventTypes();
}

export async function createEventType(input: CreateEventTypeSchema) {
	return await repository.createEventType({
		name: input.name,
	});
}

export async function deleteEventType(eventTypeId: number) {
	const exists = await repository.findEventType(eventTypeId);
	if (!exists) throw new NotFoundError("Event type not found");
	return await repository.deleteEventType(eventTypeId);
}
