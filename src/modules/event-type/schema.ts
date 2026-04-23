import z from "zod";

export const createEventTypeSchema = z
	.object({
		name: z
			.string({ error: "Invalid name value" })
			.trim()
			.nonempty({ error: "Name cannot be empty" })
			.max(256, { error: "Name cannot exceed 256 characters" }),
	})
	.strict();

export const deleteEventTypeSchema = z
	.object({
		id: z.coerce.number({ error: "Invalid event type ID" }).int({ error: "Invalid event type ID" }),
	})
	.strict();

export type CreateEventTypeSchema = z.output<typeof createEventTypeSchema>;
