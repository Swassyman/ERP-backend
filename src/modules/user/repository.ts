import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db/index.js";
import { dbAction, unreachable } from "@/lib/helpers.js";

export const insertUser = dbAction(
	async (
		userData: { email: string; passwordHash: string; fullName: string },
		tokenData: {
			tokenHash: string;
			type: (typeof schema.passwordTokenTypeEnum.enumValues)[number];
			expiresAt: string;
		},
	) => {
		return await db.transaction(async (tx) => { //transaction because to maintain db consistency (Both user and token should be inserted or neither should be).
			const [user] = await tx
				.insert(schema.user)
				.values({
					type: "end_user",
					email: userData.email,
					passwordHash: userData.passwordHash,
					fullName: userData.fullName,
					isActive: false,
				})
				.returning({
					id: schema.user.id,
				});

			if (user == null) unreachable();

			await tx.insert(schema.userPasswordToken).values({
				userId: user.id,
				tokenHash: tokenData.tokenHash,
				type: tokenData.type,
				expiresAt: tokenData.expiresAt,
			});

			return user;
		});
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


export const rollbackUserCreation = dbAction(async (userId: number) => {
	await db.transaction(async (tx) => {
		await tx.delete(schema.userPasswordToken).where(eq(schema.userPasswordToken.userId, userId));
		await tx.delete(schema.user).where(eq(schema.user.id, userId));
	});
});

export const findUserById = dbAction(async (id: number) => {
	return await db.query.user.findFirst({
		where: and(eq(schema.user.id, id), isNull(schema.user.deletedAt)),
	});
});

export const findUserByEmail = dbAction(async (email: string) => {
	return await db.query.user.findFirst({
		where: and(eq(schema.user.email, email), isNull(schema.user.deletedAt)),
	});
});
