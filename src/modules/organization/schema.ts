import z from "zod";

export const createOrganizationSchema = z
	.object({
		name: z
			.string({ error: "Invalid name value" })
			.trim()
			.nonempty({ error: "Name cannot be empty" })
			.max(256, { error: "Name cannot exceed 256 characters" }),
		organizationTypeId: z.int({ error: "Invalid organization type ID" }),
		parentOrganizationId: z.int({ error: "Invalid organization ID" }).nullish(), // note: do this everywhere
	})
	.strict();

export const organizationScopedSchema = z
	.object({
		id: z.coerce
			.number({ error: "Invalid organization ID" })
			.int({ error: "Invalid organization ID" }),
	})
	.strict();

export const addMemberToOrganizationSchema = z.object({
	userId: z.coerce.number({ error: "Invalid user ID" }).int({ error: "Invalid user ID" }),
	roleId: z.coerce.number({ error: "Invalid role ID" }).int({ error: "Invalid role ID" }),
});

export type CreateOrganizationSchema = z.output<typeof createOrganizationSchema>;
export type OrganizationScopedSchema = z.output<typeof organizationScopedSchema>;
export type AddMemberToOrganizationSchema = z.output<typeof addMemberToOrganizationSchema>;
