import z from "zod";
import { EVENT_STATUS } from "@/lib/constants.js";

export const createEventSchema = z
	.object({
		eventTitle: z
			.string({ error: "Invalid title value" })
			.trim()
			.nonempty({ error: "Title cannot be empty" })
			.max(256, { error: "Title cannot exceed 256 characters" }),
		eventTypeId: z.coerce
			.number({ error: "Invalid event type ID" })
			.int({ error: "Invalid event type ID" }),
		expectedParticipants: z.coerce.number({ error: "" }).int({ error: "" }).positive({ error: "" }),
		requestDetails: z.string({ error: "" }).trim().nonempty({ error: "" }),
		parentEventId: z.coerce.number({ error: "" }).int({ error: "" }).nullish(),
		startsAt: z.iso.datetime({ offset: true, error: "" }),
		endsAt: z.iso.datetime({ offset: true, error: "" }),
	})
	.strict();

export const eventScopedSchema = z
	.object({
		id: z.coerce.number({ error: "Invalid event ID" }).int({ error: "Invalid event ID" }),
	})
	.strict();

export const getEventsQuerySchema = z
	.object({
		status: z
			.string()
			.transform((val) => val.split(",").map((s) => s.trim()))
			.pipe(z.array(z.enum(EVENT_STATUS))),
		eventTypeId: z.coerce.number().int({ error: "Invalid event type ID" }),
	})
	.partial();

export const updateEventSchema = z
	.object({
		eventTitle: z
			.string({ error: "Invalid title value" })
			.trim()
			.nonempty({ error: "Title cannot be empty" })
			.max(256, { error: "Title cannot exceed 256 characters" }),
		eventTypeId: z.coerce
			.number({ error: "Invalid event type ID" })
			.int({ error: "Invalid event type ID" }),
		expectedParticipants: z.coerce.number({ error: "" }).int({ error: "" }).positive({ error: "" }),
		requestDetails: z.string({ error: "" }).trim().nonempty({ error: "" }),
		parentEventId: z.coerce.number({ error: "" }).int({ error: "" }).nullish(),
		startsAt: z.iso.datetime({ offset: true, error: "" }),
		endsAt: z.iso.datetime({ offset: true, error: "" }),
	})
	.partial();

export type CreateEventSchema = z.output<typeof createEventSchema>;
export type GetEventsQuerySchema = z.output<typeof getEventsQuerySchema>;
export type UpdateEventSchema = z.output<typeof updateEventSchema>;
export type EventScopedSchema = z.output<typeof eventScopedSchema>;
