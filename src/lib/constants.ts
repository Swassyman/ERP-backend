import { quickEnv } from "./helpers.js";

// === Application Level
export const IS_PROD = quickEnv("NODE_ENV") === "production";

export const INSTITUTION_NAME = "TKMCE";
export const INSTITUTION_DOMAIN = "tkmce.ac.in";

export const REFRESH_TOKEN_COOKIE_NAME = "refresh-token";

// === System Level
export const USER_TYPES = ["admin", "end_user"] as const;
export const MANAGED_ENTITY_TYPES = ["organization", "venue"] as const;
export const VENUE_ACCESS_LEVELS = ["public", "private"] as const;

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

export const FLATTENED_PERMISSIONS = Object.fromEntries(
	Object.entries(PERMISSION).flatMap(([scope, permissions]) => {
		return flattenPermissions(scope as PermissionScope, permissions);
	}),
) as Record<PermissionCode, string>;

function flattenPermissions<T extends keyof typeof PERMISSION>(
	scope: T,
	actions: (typeof PERMISSION)[T],
): [string, string][] {
	return Object.entries(actions).map(([action, description]) => [
		`${scope}:${action}`,
		description,
	]);
}
