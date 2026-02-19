import { relations, sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	bigint,
	boolean,
	check,
	integer,
	pgEnum,
	pgTable,
	smallint,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";

// Enums

export const organizationTypeEnum = pgEnum("organization_type", [
	"department",
	"club",
	"institution",
]);

// Common fields
const commonFields = {
	createdAt: timestamp({ mode: "string", withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp({ mode: "string", withTimezone: true })
		.defaultNow()
		.$onUpdate(() => sql`now()`)
		.notNull(),
};

// Tables

export const organization = pgTable(
	"organization",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		name: text().notNull(),
		type: organizationTypeEnum().notNull(),
		parentOrganizationId: integer()
			.references((): AnyPgColumn => organization.id)
			.notNull(),
		isActive: boolean().notNull().default(true),
		deletedAt: timestamp({ mode: "string", withTimezone: true }),
		...commonFields,
	},
	(t) => [unique().on(t.name)],
);

export const user = pgTable(
	"user",
	{
		id: bigint({ mode: "bigint" }).primaryKey().generatedAlwaysAsIdentity(),
		fullName: text().notNull(),
		email: text().notNull(),
		passwordHash: text().notNull(),
		isActive: boolean().notNull().default(true),
		deletedAt: timestamp({ mode: "string", withTimezone: true }),
		...commonFields,
	},
	(t) => [
		unique().on(t.email),
		check("email_check", sql`${t.email} LIKE '%@tkmce.ac.in'`),
	],
);

export const userRelations = relations(user, (r) => ({
	organizationRoles: r.many(organizationUser),
}));

export const role = pgTable(
	"role",
	{
		id: smallint().primaryKey().generatedAlwaysAsIdentity(),
		roleName: text().notNull(),
		...commonFields,
	},
	(t) => [unique().on(t.roleName)],
);

export const roleRelations = relations(role, (r) => ({
	organizationUsers: r.many(organizationUser),
}));

export const organizationUser = pgTable(
	"organizationUser",
	{
		id: bigint({ mode: "bigint" }).primaryKey().generatedAlwaysAsIdentity(),
		userId: bigint({ mode: "bigint" })
			.references(() => user.id)
			.notNull(),
		roleId: smallint()
			.references(() => role.id)
			.notNull(),
		organizationId: integer()
			.references(() => organization.id)
			.notNull(),
		isActive: boolean().notNull().default(true),
		deletedAt: timestamp({ mode: "string", withTimezone: true }),
		...commonFields,
	},
	(t) => [
		unique()
			.on(t.userId, t.roleId, t.organizationId, t.deletedAt)
			.nullsNotDistinct(),
	],
);

export const organizationUserRelation = relations(organizationUser, (r) => ({
	user: r.one(user, {
		fields: [organizationUser.userId],
		references: [user.id],
	}),
	role: r.one(role, {
		fields: [organizationUser.roleId],
		references: [role.id],
	}),
	organization: r.one(organization, {
		fields: [organizationUser.organizationId],
		references: [organization.id],
	}),
}));

// export const permission = pgTable("permission", {
// 	id: integer().primaryKey().generatedAlwaysAsIdentity(),
// 	permissionName: text().notNull().unique(),
// });

// export const rolePermission = pgTable("rolePermission", {
// 	id: integer().primaryKey().generatedAlwaysAsIdentity(),
// 	permissionId: integer()
// 		.references(() => permission.id)
// 		.notNull(),
// 	roleId: smallint()
// 		.references(() => role.id)
// 		.notNull(),
// });
