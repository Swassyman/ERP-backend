import { NotFoundError } from "@/lib/errors.js";
import * as repository from "./repository.js";
import type { CreateEventTypeSchema, AllowedParentParamsSchema } from "./schema.js";

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

export async function getEventTypeChildTypes(parentEventTypeId: number) {
	return await repository.getEventTypeChildTypes(parentEventTypeId);
}

export async function addAllowedChildType(input: AllowedParentParamsSchema) {
	return await repository.addAllowedChildtype({
		parentTypeId: input.id,
		childTypeId: input.childId,
	});
}

export async function removeAllowedChildType(input: AllowedParentParamsSchema) {
	return await repository.removeAllowedChildType({
		parentTypeId: input.id,
		childTypeId: input.childId,
	});
}
