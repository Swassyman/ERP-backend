import * as repository from "./repository.js";
import { getUserOrganizations } from "../user/repository.js";
import type { CreateEventSchema, GetEventsQuerySchema, UpdateEventSchema } from "./schema.js";

export async function createEvent(input: CreateEventSchema) {
	return await repository.createEvent({
		eventTitle: input.eventTitle,
		eventTypeId: input.eventTypeId,
		expectedParticipants: input.expectedParticipants,
		requestDetails: input.requestDetails,
		startsAt: input.startsAt,
		endsAt: input.endsAt,
		parentEventId: input.parentEventId,
	});
}

export async function updateEvent(id: number, input: UpdateEventSchema) {
	return await repository.updateEvent({
		eventId: id,
		eventTitle: input.eventTitle,
		eventTypeId: input.eventTypeId,
		expectedParticipants: input.expectedParticipants,
		requestDetails: input.requestDetails,
		startsAt: input.startsAt,
		endsAt: input.endsAt,
		parentEventId: input.parentEventId,
	});
}

export async function getEvents(
	user: { id: number; type: UserType; permissions: PermissionCode[] },
	filter: GetEventsQuerySchema,
) {
	let events: {
		id: number;
		eventTitle: string;
		eventType: string;
		status: "draft" | "awaiting_approval" | "cancelled" | "overridden" | "completed";
		parentEventId: number | null;
		parentEventTitle: string | null;
		startsAt: string;
	}[] = [];

	if (user.type === "end_user") {
		if (user.permissions.includes("event:view_all")) {
			const newEvents = await repository.findEvents({
				status: filter.status,
				eventTypeId: filter.eventTypeId,
			});
			events.push(...newEvents);
		}
		if (user.permissions.includes("event:view_all_confirmed")) {
			const newEvents = await repository.findEvents({
				status: ["completed"],
				eventTypeId: filter.eventTypeId,
			});
			events.push(...newEvents);
		}
		if (user.permissions.includes("event:view_own")) {
			const organizationIds = await getUserOrganizations(user.id);

			const organizationEvents = await Promise.all(
				organizationIds.map((o) =>
					repository.findEvents({
						status: filter.status,
						eventTypeId: filter.eventTypeId,
						organizationId: o,
					}),
				),
			);

			const newEvents = organizationEvents.flat();
			events.push(...newEvents);
		}
	} else if (user.type === "admin") {
		events = await repository.findEvents({
			status: filter.status,
			eventTypeId: filter.eventTypeId,
		});
	}

	if (events.length === 0) return [];

	const organizers = await repository.findOrganizersByEventIds(events.map((e) => e.id));

	const organizersByEventId = new Map<
		number,
		{
			organizerId: number;
			organizerName: string;
			organizerType: EventOrganizerRole;
		}[]
	>();

	for (const o of organizers) {
		const existing = organizersByEventId.get(o.eventId) ?? [];

		existing.push({
			organizerId: o.organizerId,
			organizerName: o.organizerName,
			organizerType: o.organizerType,
		});

		organizersByEventId.set(o.eventId, existing);
	}

	return events.map((event) => ({
		id: event.id,
		eventTitle: event.eventTitle,
		eventType: event.eventType,
		status: event.status,
		parentEventId: event.parentEventId ?? null,
		parentEventTitle: event.parentEventTitle ?? null,
		startsAt: event.startsAt,
		organizers: organizersByEventId.get(event.id) ?? [],
	}));
}
