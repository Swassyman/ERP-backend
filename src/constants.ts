import type { PermissionCode, PermissionScope } from "./config/types.js";

export const INSTITUTION_NAME = "TKMCE";
export const INSTITUTION_DOMAIN_REGEXP = /@tkmce\.ac\.in$/;

// todo: fill
// NOTE: keep it sorted like the schema:
export const PERMISSION = {
	user: {
		create: "Create users",
		modify: "Modify users",
		delete: "Delete users",
	},
	organization: {
		create: "Create organizations",
		modify: "Modify organizations",
		delete: "Delete organizations",
		assign_users: "Assign users to organizations",
	},
} as const;

export const PERMISSION_SCOPES = Object.keys(PERMISSION) as PermissionScope[];

function flattenPermissions<T extends keyof typeof PERMISSION>(
	scope: T,
	actions: (typeof PERMISSION)[T],
): [string, string][] {
	return Object.entries(actions).map(([action, description]) => [
		`${scope}:${action}`,
		description,
	]);
}

export const FLATTENED_PERMISSIONS = Object.fromEntries(
	Object.entries(PERMISSION).flatMap(([scope, permissions]) => {
		return flattenPermissions(scope as PermissionScope, permissions);
	}),
) as Record<PermissionCode, string>;
