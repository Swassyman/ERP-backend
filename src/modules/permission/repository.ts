import { eq } from "drizzle-orm";
import { db, schema } from "@/config/db.js";

export async function getPermissions() {
	return await db
		.select({
			id: schema.permission.id,
			code: schema.permission.code,
			description: schema.permission.description,
		})
		.from(schema.permission);
}

export async function findPermission(permissionId: number) {
	const [permission] = await db
		.select({
			id: schema.permission.id,
			code: schema.permission.code,
			description: schema.permission.description,
		})
		.from(schema.permission)
		.where(eq(schema.permission.id, permissionId))
		.limit(1);
	return permission;
}
