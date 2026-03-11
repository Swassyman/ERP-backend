import { eq } from "drizzle-orm";
import { db, schema } from "@/db/index.js";
import { dbAction } from "@/lib/helpers.js";

export const getPermissions = dbAction(async () => {
	return await db
		.select({
			id: schema.permission.id,
			code: schema.permission.code,
			description: schema.permission.description,
		})
		.from(schema.permission);
});

export const findPermission = dbAction(async (permissionId: number) => {
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
});
