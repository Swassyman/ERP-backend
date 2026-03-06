import z from "zod";

export const createVenueTypeSchema = z
	.object({
		name: z
			.string({ error: "Invalid name type" })
			.trim() // do this everywhere
			.nonempty({ error: "Name must not be empty" })
			.max(256, { error: "Name cannot be longer than 256 characters" }),
	})
	.strict();

export const venueTypeScopedSchema = z
	.object({
		id: z.coerce.number({ error: "Invalid venue type ID" }),
	})
	.strict();

export const createVenueTypeRoleSchema = z
	.object({
		name: z
			.string({ error: "Invalid role name" })
			.trim()
			.nonempty({ error: "Name must not be empty" })
			.max(256, { error: "Name cannot be longer than 256 characters" }),
	})
	.strict();

export type CreateVenueTypeSchema = z.output<typeof createVenueTypeSchema>;
export type VenueTypeScopedSchema = z.output<typeof venueTypeScopedSchema>;
export type CreateVenueTypeRoleSchema = z.output<
	typeof createVenueTypeRoleSchema
>;
