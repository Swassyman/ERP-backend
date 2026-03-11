import { and, eq, inArray, isNull } from "drizzle-orm";
import { db, schema } from "@/db/index.js";
import { dbAction } from "@/lib/helpers.js";

export const findUserByEmail = dbAction(async (email: string) => {
	return await db.query.user.findFirst({
		where: and(eq(schema.user.email, email), isNull(schema.user.deletedAt)),
	});
});

export const getUserWithPermissions = dbAction(async (id: number) => {
	const user = await db.query.user.findFirst({
		where: and(eq(schema.user.id, id), isNull(schema.user.deletedAt)),
		columns: {
			id: true,
			email: true,
			fullName: true,
			type: true,
		},
		with: {
			roles: {
				columns: {},
				with: {
					role: {
						columns: {
							id: true,
						},
					},
				},
			},
		},
	});

	if (user == null) {
		return null;
	}

	const permissions = await db
		.selectDistinct({ code: schema.permission.code })
		.from(schema.rolePermission)
		.innerJoin(
			schema.permission,
			eq(schema.rolePermission.permissionId, schema.permission.id),
		)
		.where(
			inArray(
				schema.rolePermission.roleId,
				user.roles.map(({ role }) => role.id),
			),
		);

	return {
		...user,
		permissions: permissions.map((permission) => permission.code),
	};
});
