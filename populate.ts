import { confirm } from "@inquirer/prompts";
import "dotenv/config";
import { and, eq, inArray, isNull, type SQL, sql } from "drizzle-orm";
import { db, schema } from "./src/config/db.js";
import type { PermissionCode, PermissionScope } from "./src/config/types.js";
import { INSTITUTION_NAME, PERMISSION } from "./src/constants.js";
import { isPermission, unreachable } from "./src/utilities/helpers.js";

// INSTITUTION ORGANIZATION

console.log("Setting up institution organization");
const institutionOrg = await db
	.select()
	.from(schema.organization)
	.where(
		and(
			eq(schema.organization.type, "institution"),
			isNull(schema.organization.deletedAt),
		),
	);

if (institutionOrg.length === 1) {
	console.log("institution organization have been setup already.");
	// todo: update institution name if doesn't match with constant.
} else if (institutionOrg.length === 0) {
	await db
		.insert(schema.organization)
		.values({ name: INSTITUTION_NAME, type: "institution" });
	console.log("Successfully setup institution organization.");
} else {
	throw new Error(
		`Misconfiguration in database: found ${institutionOrg.length} institution type organization`,
	);
}

// ROLES

// console.log("Setting up user roles");
// const existingRoles = await db.query.role
// 	.findMany({ where: isNull(schema.role.deletedAt) })
// 	.then((roles) =>
// 		Object.fromEntries(roles.map((role) => [role.code, role])),
// 	);

// const rolesToInsert: RoleCode[] = [];
// const rolesToUpdate: RoleCode[] = [];
// const rolesToDelete: number[] = [];

// for (const roleCode in ROLE) {
// 	if (!isRole(roleCode)) unreachable();
// 	if (roleCode in existingRoles) {
// 		if (
// 			existingRoles[roleCode] != null &&
// 			ROLE[roleCode] !== existingRoles[roleCode].name
// 		) {
// 			// mismatch in display names
// 			rolesToUpdate.push(roleCode);
// 		} else {
// 			// don't care
// 		}
// 	} else {
// 		rolesToInsert.push(roleCode);
// 	}
// }
// for (const roleCode in existingRoles) {
// 	if (roleCode in ROLE) {
// 		// don't care. have already handled the modification state.
// 	} else {
// 		if (existingRoles[roleCode] == null) {
// 			unreachable();
// 		}
// 		rolesToDelete.push(existingRoles[roleCode].id);
// 	}
// }
// console.log({
// 	rolesToInsert,
// 	rolesToUpdate,
// 	rolesToDelete,
// });

// if (
// 	rolesToInsert.length > 0 &&
// 	(await confirm({
// 		message: `Insert ${rolesToInsert.length} roles?`,
// 	}))
// ) {
// 	const inserted = await db.insert(schema.role).values(
// 		rolesToInsert.map((roleCode) => {
// 			return {
// 				code: roleCode,
// 				name: ROLE[roleCode],
// 			} satisfies typeof schema.role.$inferInsert;
// 		}),
// 	);
// 	console.log("inserted", inserted.rowCount, "roles");
// }
// if (
// 	rolesToUpdate.length > 0 &&
// 	(await confirm({
// 		message: `Update ${rolesToUpdate.length} roles?`,
// 	}))
// ) {
// 	const sqlChunks: SQL[] = [];
// 	sqlChunks.push(sql`(case`);
// 	for (const roleCode of rolesToUpdate) {
// 		sqlChunks.push(sql`when code = '${roleCode}' then '${ROLE[roleCode]}'`);
// 	}
// 	sqlChunks.push(sql`end)`);
// 	const finalSql: SQL = sql.join(sqlChunks, sql.raw(" "));
// 	const updated = await db
// 		.update(schema.role)
// 		.set({ name: finalSql })
// 		.where(inArray(schema.role.code, rolesToUpdate));
// 	console.log("updated", updated.rowCount, "roles");
// }
// if (
// 	rolesToDelete.length > 0 &&
// 	(await confirm({
// 		message: `Delete ${rolesToDelete.length} roles?`,
// 	}))
// ) {
// 	const softDeletedRoles = await db
// 		.update(schema.role)
// 		.set({ deletedAt: sql`now()` })
// 		.where(
// 			and(
// 				isNull(schema.role.deletedAt),
// 				inArray(schema.role.id, rolesToDelete),
// 			),
// 		);
// 	console.log("soft-deleted", softDeletedRoles.rowCount, "roles");
// 	const softDeletedRolePermissions = await db
// 		.update(schema.rolePermission)
// 		.set({ deletedAt: sql`now()` })
// 		.where(
// 			and(
// 				isNull(schema.rolePermission.deletedAt),
// 				inArray(schema.rolePermission.roleId, rolesToDelete),
// 			),
// 		);
// 	console.log(
// 		"soft-deleted",
// 		softDeletedRolePermissions.rowCount,
// 		"role permissions",
// 	);
// }

// PERMISSIONS

console.log("Setting up permissions");

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

const existingPermissions = await db
	.select()
	.from(schema.permission)
	.where(isNull(schema.permission.deletedAt))
	.then((perms) =>
		Object.fromEntries(perms.map((perm) => [perm.code, perm])),
	);

const permissionsToInsert: PermissionCode[] = [];
const permissionsToUpdate: PermissionCode[] = [];
const permissionsToDelete: number[] = [];

for (const permissionCode in FLATTENED_PERMISSIONS) {
	if (!isPermission(permissionCode)) unreachable();
	if (
		permissionCode in existingPermissions &&
		existingPermissions[permissionCode] != null
	) {
		if (
			FLATTENED_PERMISSIONS[permissionCode] !==
			existingPermissions[permissionCode].description
		) {
			// mismatch in display names
			permissionsToUpdate.push(permissionCode);
		} else {
			// don't care
		}
	} else {
		permissionsToInsert.push(permissionCode);
	}
}
for (const permissionCode in existingPermissions) {
	if (permissionCode in FLATTENED_PERMISSIONS) {
		// don't care. have already handled the modification state.
	} else {
		if (existingPermissions[permissionCode] == null) {
			unreachable();
		}
		permissionsToDelete.push(existingPermissions[permissionCode].id);
	}
}

console.log({ permissionsToInsert, permissionsToUpdate, permissionsToDelete });

if (
	permissionsToInsert.length > 0 &&
	(await confirm({
		message: `Insert ${permissionsToInsert.length} permissions?`,
	}))
) {
	const inserted = await db.insert(schema.permission).values(
		permissionsToInsert.map(
			(permission) =>
				({
					code: permission,
					description: FLATTENED_PERMISSIONS[permission],
				}) satisfies typeof schema.permission.$inferInsert,
		),
	);
	console.log("inserted", inserted.rowCount, "permissions");
}

if (
	permissionsToUpdate.length > 0 &&
	(await confirm({
		message: `Update ${permissionsToUpdate.length} permissions?`,
	}))
) {
	const sqlChunks: SQL[] = [];
	sqlChunks.push(sql`(case`);
	for (const permissionCode of permissionsToUpdate) {
		sqlChunks.push(
			sql`when code = '${permissionCode}' then '${FLATTENED_PERMISSIONS[permissionCode]}'`,
		);
	}
	sqlChunks.push(sql`end)`);
	const finalSql: SQL = sql.join(sqlChunks, sql.raw(" "));
	const updated = await db
		.update(schema.permission)
		.set({ description: finalSql })
		.where(inArray(schema.permission.code, permissionsToUpdate));
	console.log("updated", updated.rowCount, "permissions");
}

if (
	permissionsToDelete.length > 0 &&
	(await confirm({
		message: `Delete ${permissionsToDelete.length} permissions?`,
	}))
) {
	const softDeleted = await db
		.update(schema.permission)
		.set({ deletedAt: sql`now()` })
		.where(
			and(
				isNull(schema.permission.deletedAt),
				inArray(schema.permission.id, permissionsToDelete),
			),
		);
	console.log("soft-deleted", softDeleted.rowCount, "permissions");

	const softDeletedRolePermissions = await db
		.update(schema.rolePermission)
		.set({ deletedAt: sql`now()` })
		.where(
			and(
				isNull(schema.rolePermission.deletedAt),
				inArray(schema.rolePermission.roleId, permissionsToDelete),
			),
		);
	console.log(
		"soft-deleted",
		softDeletedRolePermissions.rowCount,
		"role permissions",
	);
}

// ROLE PERMISSIONS

// const dbRoles = await db
// 	.select()
// 	.from(schema.role)
// 	.where(isNull(schema.role.deletedAt))
// 	.then(
// 		(roles) =>
// 			Object.fromEntries(
// 				roles.map((role) => [role.code, role]),
// 			) as Record<RoleCode, Role>,
// 	);

// const dbPermissions = await db
// 	.select()
// 	.from(schema.permission)
// 	.where(isNull(schema.permission.deletedAt))
// 	.then((permissions) => {
// 		return Object.fromEntries(
// 			permissions.map((permission) => [permission.code, permission]),
// 		) as Record<PermissionCode, Permission>;
// 	});

// const existingRolePermissions = await db.query.role.findMany({
// 	where: isNull(schema.role.deletedAt),
// 	columns: { id: true, code: true },
// 	with: {
// 		permissions: {
// 			where: isNull(schema.rolePermission.deletedAt),
// 			with: {
// 				permission: {
// 					columns: {
// 						id: true,
// 						code: true,
// 					},
// 				},
// 			},
// 			columns: {
// 				id: true,
// 			},
// 		},
// 	},
// });

// const rolePermissionsToInsert: { roleId: number; permissionId: number }[] = [];
// const rolePermissionsToDelete: number[] = [];

// const rolePermissions: Record<number, number[]> = {};

// for (const roleCode in ROLE_PERMISSIONS) {
// 	if (!isRole(roleCode)) unreachable();

// 	if (!(roleCode in dbRoles)) {
// 		// role doesn't exist in db, so add just all permissions.
// 		// buTTT this never happens! because we ensured all the roles are in sync.
// 		// so if this ever gets executed, then:
// 		throw new Error(`expected role '${roleCode}' to be in the database.`);
// 	}

// 	// role already exists in db, just find and add missing roles.

// 	const dbRole = dbRoles[roleCode];
// 	rolePermissions[dbRole.id] = [];

// 	for (const permissionCode of ROLE_PERMISSIONS[roleCode]) {
// 		const dbPermission = dbPermissions[permissionCode]; // this is ensured, since its synced.

// 		const existingRolePermission = existingRolePermissions
// 			.find((role) => role.id === dbRole.id)
// 			?.permissions.find(
// 				({ permission }) => permission.id === dbPermission.id,
// 			);

// 		if (existingRolePermission == null) {
// 			// the rolepermission is missing in db, so add to it database.
// 			rolePermissionsToInsert.push({
// 				roleId: dbRole.id,
// 				permissionId: dbPermission.id,
// 			});
// 		}
// 	}
// }

// for (const dbRole of existingRolePermissions) {
// 	if (!isRole(dbRole.code)) unreachable();

// 	const matchingRealRole = ROLE_PERMISSIONS[dbRole.code];

// 	for (const dbRolePermission of dbRole.permissions) {
// 		// this runs for every role permission in db.
// 		// if one of them doesn't exist in the real permissions suite, then delete.

// 		const matchingRealRolePermission = matchingRealRole.find(
// 			(permission) => permission === dbRolePermission.permission.code,
// 		);
// 		if (matchingRealRolePermission == null) {
// 			// not found in real permission set: delete!
// 			rolePermissionsToDelete.push(dbRolePermission.id);
// 		}
// 	}
// }

// console.log({ rolePermissionsToInsert, rolePermissionsToDelete });

// if (
// 	rolePermissionsToInsert.length > 0 &&
// 	(await confirm({
// 		message: `Insert ${rolePermissionsToInsert.length} role-permissions?`,
// 	}))
// ) {
// 	const inserted = await db.insert(schema.rolePermission).values(
// 		rolePermissionsToInsert.map(
// 			(rolePermission) =>
// 				({
// 					roleId: rolePermission.roleId,
// 					permissionId: rolePermission.permissionId,
// 				}) satisfies typeof schema.rolePermission.$inferInsert,
// 		),
// 	);
// 	console.log("inserted", inserted.rowCount, "role permissions");
// }

// if (
// 	rolePermissionsToDelete.length > 0 &&
// 	(await confirm({
// 		message: `Delete ${rolePermissionsToDelete.length} role-permissions?`,
// 	}))
// ) {
// 	const softDeleted = await db
// 		.update(schema.rolePermission)
// 		.set({ deletedAt: sql`now()` })
// 		.where(
// 			and(
// 				isNull(schema.rolePermission.deletedAt), // only delete the ones that have not been deleted yet.
// 				inArray(schema.rolePermission.id, rolePermissionsToDelete),
// 			),
// 		);
// 	console.log("soft-deleted", softDeleted.rowCount, "role permissions");
// }
