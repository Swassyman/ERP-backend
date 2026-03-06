import z from "zod";

export const permissionScopedSchema = z
	.object({
		id: z.coerce
			.number({ error: "Invalid permission ID" })
			.int({ error: "Invalid permission ID" }),
	})
	.strict();

export type PermissionScopedSchema = z.output<typeof permissionScopedSchema>;
