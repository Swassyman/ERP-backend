import type { PermissionScope } from "./config/types.js";

export const INSTITUTION_NAME = "TKMCE";
export const INSTITUTION_DOMAIN_REGEXP = /@tkmce\.ac\.in$/;

// export const ROLE = {
// 	superuser: "Superuser",
// 	trust: "Trust",
// 	office: "Office",
// 	"dean-sa": "Dean (SA)",
// 	hod: "HoD",
// 	"faculty-coordinator": "Faculty coordinator",
// 	"club-head": "Club head",
// 	"placement-cell": "Placement cell",
// 	"venue-in-charge": "Venue-in-charge",
// 	"lab-assistant": "Lab assistant",
// } as const;

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

// export const ROLE_PERMISSIONS: Record<RoleCode, readonly PermissionCode[]> = {
// 	superuser: definePermissions([
// 		"organization:create",
// 		"organization:modify",
// 		"organization:delete",
// 		"organization:assign_users",
// 	] as const),
// 	trust: definePermissions([] as const),
// 	office: definePermissions([] as const),
// 	"dean-sa": definePermissions([] as const),
// 	hod: definePermissions([] as const),
// 	"faculty-coordinator": definePermissions([] as const),
// 	"club-head": definePermissions([] as const),
// 	"placement-cell": definePermissions([] as const),
// 	"venue-in-charge": definePermissions([] as const),
// 	"lab-assistant": definePermissions([] as const),
// };

// // todo: scoped is still a limitation. but i think it's good,
// // since "explicit" definitions of permissions of each role is better.
// function definePermissions<T extends readonly PermissionCode[]>(
// 	permissions: UniqueArray<T>,
// ) {
// 	return permissions;
// }
