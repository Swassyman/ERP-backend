import { db, schema } from "@/db/index.js";
import { dbAction, unreachable } from "@/lib/helpers.js";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

const parentEvent = alias(schema.event, "parent_event");

export const createEvent = dbAction(
	async (data: {
		eventTitle: string;
		eventTypeId: number;
		expectedParticipants: number;
		requestDetails: string;
		startsAt: string;
		endsAt: string;
		parentEventId: number | null | undefined;
	}) => {
		const [inserted] = await db
			.insert(schema.event)
			.values({
				eventTitle: data.eventTitle,
				eventTypeId: data.eventTypeId,
				expectedParticipants: data.expectedParticipants,
				requestDetails: data.requestDetails,
				status: "draft",
				startsAt: data.startsAt,
				endsAt: data.endsAt,
				parentEventId: data.parentEventId,
			})
			.returning({ id: schema.event.id });
		if (inserted == null) unreachable();
		return inserted;
	},
);

export const findEvents = dbAction(
	async (filter?: {
		status?:
			| ("draft" | "awaiting_approval" | "cancelled" | "overridden" | "completed")[]
			| undefined;
		eventTypeId?: number | undefined;
		organizationId?: number;
	}) => {
		const conditions = [isNull(schema.event.deletedAt)];

		if (filter?.status && filter.status.length > 0) {
			conditions.push(inArray(schema.event.status, filter.status));
		}

		if (filter?.eventTypeId) {
			conditions.push(eq(schema.event.eventTypeId, filter.eventTypeId));
		}
		if (filter?.organizationId) {
			conditions.push(eq(schema.eventOrganizer.organizationId, filter.organizationId));
		}

		return await db
			.select({
				id: schema.event.id,
				eventTitle: schema.event.eventTitle,
				eventType: schema.eventType.name,
				status: schema.event.status,
				parentEventId: schema.event.parentEventId,
				parentEventTitle: parentEvent.eventTitle,
				startsAt: schema.event.startsAt,
			})
			.from(schema.event)
			.innerJoin(schema.eventType, eq(schema.event.eventTypeId, schema.eventType.id))
			.innerJoin(schema.eventOrganizer, eq(schema.event.id, schema.eventOrganizer.eventId))
			.leftJoin(parentEvent, eq(schema.event.parentEventId, parentEvent.id))
			.where(and(...conditions))
			.orderBy(schema.event.startsAt);
	},
);

export const findOrganizersByEventIds = dbAction(async (eventIds: number[]) => {
	if (eventIds.length === 0) return [];
	return await db
		.select({
			eventId: schema.eventOrganizer.eventId,
			organizerId: schema.organization.id,
			organizerName: schema.organization.name,
			organizerType: schema.eventOrganizer.role,
		})
		.from(schema.eventOrganizer)
		.innerJoin(
			schema.organization,
			eq(schema.eventOrganizer.organizationId, schema.organization.id),
		)
		.where(
			and(
				inArray(schema.eventOrganizer.eventId, eventIds),
				isNull(schema.eventOrganizer.deletedAt),
			),
		);
});

export const updateEvent = dbAction(
	async (data: {
		eventId: number;
		eventTitle?: string | undefined;
		eventTypeId?: number | undefined;
		expectedParticipants?: number | undefined;
		requestDetails?: string | undefined;
		parentEventId?: number | null | undefined;
		startsAt?: string | undefined;
		endsAt?: string | undefined;
	}) => {
		const [updated] = await db
			.update(schema.event)
			.set({
				eventTitle: data.eventTitle,
				eventTypeId: data.eventTypeId,
				expectedParticipants: data.expectedParticipants,
				requestDetails: data.requestDetails,
				parentEventId: data.parentEventId,
				startsAt: data.startsAt,
				endsAt: data.endsAt,
			})
			.where(and(eq(schema.event.status, "draft"), eq(schema.event.id, data.eventId)))
			.returning({ id: schema.event.id });
		if (updated == null) {
			unreachable();
		}
		return updated;
	},
);

// export const getOrganizationEvents = dbAction(async (organizationId: number) => {
// 	return await db
// 		.select({
// 			id: schema.event.id,
// 			eventTitle: schema.event.eventTitle,
// 			eventType: schema.eventType.name,
// 			status: schema.event.status,
// 			parentEventId: schema.event.parentEventId,
// 			parentEventTitle: parentEvent.eventTitle,
// 			startsAt: schema.event.startsAt,
// 		})
// 		.from(schema.eventOrganizer)
// 		.innerJoin(schema.event, eq(schema.eventOrganizer.eventId, schema.event.id))
// 		.innerJoin(schema.eventType, eq(schema.event.eventTypeId, schema.eventType.id))
// 		.leftJoin(parentEvent, eq(schema.event.parentEventId, parentEvent.id))
// 		.where(eq(schema.eventOrganizer.organizationId, organizationId))
// 		.orderBy(schema.event.startsAt);
// });
