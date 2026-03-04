import z from "zod";

export const createFacilitySchema = z.object({
	name: z
		.string({ error: "Invalid facility name" })
		.trim()
		.nonempty({ error: "Facility name cannot be empty" })
		.max(256, {
			error: "Facility name length cannot exceed 256 characters",
		}),
});
