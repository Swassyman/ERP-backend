import z from "zod";

export const roleScopedSchema = z
	.object({
		id: z.coerce
			.number({ error: "Invalid role ID" })
			.int({ error: "Invalid role ID" }),
	})
	.strict();

export const setRolePermissionsSchema = z
	.object({
		permissionIds: z.array(
			z.coerce
				.number({ error: "Invalid permission ID" })
				.int({ error: "Invalid permission ID" }),
			{ error: "Invalid set of permission IDs" },
		),
	})
	.strict();

export const rolePermissionScopedSchema = roleScopedSchema
	.extend({
		permissionId: z.coerce
			.number({ error: "Invalid permission ID" })
			.int({ error: "Invalid permission ID" }),
	})
	.strict();

export type RoleScopedSchema = z.output<typeof roleScopedSchema>;
export type SetRolePermissionSchema = z.output<typeof setRolePermissionsSchema>;
export type RolePermissionScopedSchema = z.output<
	typeof rolePermissionScopedSchema
>;
