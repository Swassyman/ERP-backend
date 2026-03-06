import z from "zod";

export const createOrganizationTypeSchema = z
	.object({
		name: z
			.string({ error: "Invalid name type" })
			.trim()
			.nonempty({ error: "Name must not be empty" })
			.max(256, { error: "Name cannot be longer than 256 characters" }),
	})
	.strict();

export const organizationTypeScopedSchema = z
	.object({
		id: z.coerce.number({ error: "Invalid organization type ID" }),
	})
	.strict();

export const addAllowedParentParamsSchema = z
	.object({
		id: z.coerce.number({
			error: "Invalid organization type ID",
		}),
		childId: z.coerce.number({
			error: "Invalid child organization type ID",
		}),
	})
	.strict();

export const createOrganizationTypeRoleSchema = z
	.object({
		name: z
			.string({ error: "Invalid role name" })
			.trim()
			.nonempty({ error: "Name must not be empty" })
			.max(256, { error: "Name cannot be longer than 256 characters" }),
	})
	.strict();

export type CreateOrganizationTypeSchema = z.output<
	typeof createOrganizationTypeSchema
>;
export type OrganizationTypeScopedSchema = z.output<
	typeof organizationTypeScopedSchema
>;
export type AddAllowedParentParamsSchema = z.output<
	typeof addAllowedParentParamsSchema
>;
export type CreateOrganizationTypeRoleSchema = z.output<
	typeof createOrganizationTypeRoleSchema
>;
