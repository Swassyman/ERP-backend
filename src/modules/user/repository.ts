import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db/index.js";
import { dbAction, unreachable } from "@/lib/helpers.js";

export const insertUser = dbAction(
	async (data: { email: string; passwordHash: string; fullName: string }) => {
		const [inserted] = await db
			.insert(schema.user)
			.values({
				type: "end_user",
				email: data.email,
				passwordHash: data.passwordHash,
				fullName: data.fullName,
				isActive: false,
			})
			.returning({
				id: schema.user.id,
			});

		if (inserted == null) unreachable();

		return inserted;
	},
);

export const getUsers = dbAction(async () => {
	return await db.query.user.findMany({
		where: and(eq(schema.user.type, "end_user"), isNull(schema.user.deletedAt)),
		columns: {
			id: true,
			fullName: true,
			email: true,
			createdAt: true,
			isActive: true,
		},
		with: {
			roles: {
				columns: {
					id: true,
					isActive: true,
					createdAt: true,
					roleId: true,
					managedEntityId: true,
				},
			},
		},
	});
});
