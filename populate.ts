import { confirm } from "@inquirer/prompts";
import "dotenv/config";
import { and, eq, inArray, isNull, type SQL, sql } from "drizzle-orm";
import { db, schema } from "./src/config/db.js";
import type { PermissionCode } from "./src/config/types.js";
import { FLATTENED_PERMISSIONS, INSTITUTION_NAME } from "./src/constants.js";
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
// PERMISSIONS

console.log("Setting up permissions");

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
