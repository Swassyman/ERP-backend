import {
	type HasDefault,
	isNull,
	type NotNull,
	relations,
	sql,
} from "drizzle-orm";
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
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const ORGANIZATION_TYPES = [
	"department",
	"club",
	"institution",
] as const;
export const USER_TYPES = ["admin", "end_user"] as const;

// todo: how about switching to string based ids?

// Enums
export const organizationTypeEnum = pgEnum(
	"organization_type",
	ORGANIZATION_TYPES,
);
export const userTypeEnum = pgEnum("user_type", USER_TYPES);

// Common fields
type PgStringTimestamp = ReturnType<typeof timestamp<"string">>;
type Scope = "common" | "soft-delete";
type CommonFields = {
	createdAt: NotNull<HasDefault<PgStringTimestamp>>;
	updatedAt: NotNull<HasDefault<PgStringTimestamp>>;
};
type SoftDeleteFields = {
	deletedAt: PgStringTimestamp;
};
type FieldsFor<T extends readonly Scope[]> = ("common" extends T[number]
	? CommonFields
	: Record<never, never>) &
	("soft-delete" extends T[number] ? SoftDeleteFields : Record<never, never>);

function fields<const T extends readonly Scope[]>(...scopes: T): FieldsFor<T> {
	return {
		...(scopes.includes("common") && {
			createdAt: timestamp({ mode: "string", withTimezone: true })
				.defaultNow()
				.notNull(),
			updatedAt: timestamp({ mode: "string", withTimezone: true })
				.defaultNow()
				.$onUpdate(() => sql`now()`)
				.notNull(),
		}),
		...(scopes.includes("soft-delete") && {
			deletedAt: timestamp({
				mode: "string",
				withTimezone: true,
			}),
		}),
	} as FieldsFor<T>;
}

// Tables

export const organization = pgTable(
	"organization",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		name: text().notNull(),
		type: organizationTypeEnum().notNull(),
		parentOrganizationId: integer().references(
			(): AnyPgColumn => organization.id,
		),
		isActive: boolean().notNull().default(true),
		...fields("common", "soft-delete"),
	},
	(t) => [uniqueIndex().on(t.name).where(isNull(t.deletedAt))],
);

export const organizationRelations = relations(organization, (r) => ({
	userRoles: r.many(organizationUserRole),
	parentOrganization: r.one(organization, {
		fields: [organization.parentOrganizationId],
		references: [organization.id],
	}),
}));

export const user = pgTable(
	"user",
	{
		id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
		type: userTypeEnum().notNull(),
		fullName: text().notNull(),
		email: text().notNull(),
		passwordHash: text().notNull(),
		isActive: boolean().notNull().default(true),
		...fields("common", "soft-delete"),
	},
	(t) => [
		uniqueIndex().on(t.email).where(isNull(t.deletedAt)),
		check("email_check", sql`${t.email} LIKE '%@tkmce.ac.in'`), // todo: fix constraint with constant
	],
);

export const userRelations = relations(user, (r) => ({
	organizationRoles: r.many(organizationUserRole),
}));

export const role = pgTable(
	"role",
	{
		id: smallint().primaryKey().generatedAlwaysAsIdentity(),
		name: text().notNull(),
		code: text().notNull(),
		...fields("common", "soft-delete"),
	},
	(t) => [
		// uniqueIndex().on(t.name).where(isNull(t.deletedAt)), // todo: needed?
		uniqueIndex().on(t.code).where(isNull(t.deletedAt)),
	],
);

export const roleRelations = relations(role, (r) => ({
	organizationUsers: r.many(organizationUserRole),
	permissions: r.many(rolePermission),
}));

export const organizationUserRole = pgTable(
	"organization_user_role",
	{
		id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
		userId: bigint({ mode: "number" })
			.references(() => user.id)
			.notNull(),
		roleId: smallint()
			.references(() => role.id)
			.notNull(),
		organizationId: integer()
			.references(() => organization.id)
			.notNull(),
		isActive: boolean().notNull().default(true),
		...fields("common", "soft-delete"),
	},
	(t) => [
		uniqueIndex()
			.on(t.userId, t.roleId, t.organizationId)
			.where(isNull(t.deletedAt)),
	],
);

export const organizationUserRoleRelations = relations(
	organizationUserRole,
	(r) => ({
		user: r.one(user, {
			fields: [organizationUserRole.userId],
			references: [user.id],
		}),
		role: r.one(role, {
			fields: [organizationUserRole.roleId],
			references: [role.id],
		}),
		organization: r.one(organization, {
			fields: [organizationUserRole.organizationId],
			references: [organization.id],
		}),
	}),
);

export const permission = pgTable(
	"permission",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		code: text().notNull(),
		description: text().notNull(),
		...fields("common", "soft-delete"),
	},
	(t) => [
		// uniqueIndex().on(t.name).where(isNull(t.deletedAt)), // todo: needed?
		uniqueIndex().on(t.code).where(isNull(t.deletedAt)),
	],
);

export const permissionRelations = relations(permission, (r) => ({
	associatedRoles: r.many(rolePermission),
}));

export const rolePermission = pgTable(
	"role_permission",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		permissionId: integer()
			.references(() => permission.id)
			.notNull(),
		roleId: smallint()
			.references(() => role.id)
			.notNull(),
		...fields("common", "soft-delete"),
	},
	(t) => [
		uniqueIndex().on(t.roleId, t.permissionId).where(isNull(t.deletedAt)),
	],
);

export const rolePermissionRelations = relations(rolePermission, (r) => ({
	permission: r.one(permission, {
		fields: [rolePermission.permissionId],
		references: [permission.id],
	}),
	role: r.one(role, {
		fields: [rolePermission.roleId],
		references: [role.id],
	}),
}));
