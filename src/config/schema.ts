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
	primaryKey,
	smallint,
	text,
	timestamp,
	unique,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import type { PermissionCode } from "./types.js";

export const USER_TYPES = ["admin", "end_user"] as const;
export const MANAGED_ENTITY_TYPES = ["organization", "venue"] as const;

// todo: how about switching to string based ids?

// Enums
export const userTypeEnum = pgEnum("user_type", USER_TYPES);
export const managedEntityTypeEnum = pgEnum(
	"managed_entity_type",
	MANAGED_ENTITY_TYPES,
);

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

export const managedEntity = pgTable(
	"managed_entity",
	{
		id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
		managedEntityType: managedEntityTypeEnum().notNull(),
		refId: integer().notNull(), // todo: make trigger for check
		...fields("common", "soft-delete"),
	},
	(t) => [
		uniqueIndex()
			.on(t.managedEntityType, t.refId)
			.where(isNull(t.deletedAt)),
	],
	// soft-fk(ref_id) -> organization, venue
);

export const organizationType = pgTable(
	"organization_type",
	{
		id: smallint().primaryKey().generatedAlwaysAsIdentity(),
		name: text().notNull(), // institution, department, club, cgpu
		...fields("common", "soft-delete"),
	},
	(t) => [uniqueIndex().on(t.name).where(isNull(t.deletedAt))],
);

export const organizationTypeRelations = relations(organizationType, (r) => ({
	organizations: r.many(organization),
	parents: r.many(organizationTypeAllowedParent, {
		relationName: "as_child",
	}),
	children: r.many(organizationTypeAllowedParent, {
		relationName: "as_parent",
	}),
}));

export const organizationTypeAllowedParent = pgTable(
	"organization_type_allowed_parent",
	{
		childTypeId: smallint()
			.references(() => organizationType.id)
			.notNull(),
		parentTypeId: smallint()
			.references(() => organizationType.id)
			.notNull(),
		...fields("common"), // no soft-deletes :)
	},
	(t) => [primaryKey({ columns: [t.childTypeId, t.parentTypeId] })],
);

export const organizationTypeAllowedParentRelations = relations(
	organizationTypeAllowedParent,
	(r) => ({
		childType: r.one(organizationType, {
			fields: [organizationTypeAllowedParent.childTypeId],
			references: [organizationType.id],
			relationName: "as_child",
		}),
		parentType: r.one(organizationType, {
			fields: [organizationTypeAllowedParent.parentTypeId],
			references: [organizationType.id],
			relationName: "as_parent",
		}),
	}),
);

export const organization = pgTable(
	"organization",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		name: text().notNull(),
		organizationTypeId: smallint()
			.references(() => organizationType.id)
			.notNull(),
		parentOrganizationId: integer().references(
			(): AnyPgColumn => organization.id,
		),
		isActive: boolean().notNull().default(true),
		...fields("common", "soft-delete"),
	},
	(t) => [
		uniqueIndex().on(t.name).where(isNull(t.deletedAt)), // todo: discuss whether to add 'organizationTypeId' to unique
	],
);

export const organizationRelations = relations(organization, (r) => ({
	userRoles: r.many(userRole),
	type: r.one(organizationType, {
		fields: [organization.organizationTypeId],
		references: [organizationType.id],
	}),
	parentOrganization: r.one(organization, {
		fields: [organization.parentOrganizationId],
		references: [organization.id],
		relationName: "parent",
	}),
	childOrganizations: r.many(organization, {
		relationName: "parent",
	}),
	// soft-fk(managed_entity)
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
	roles: r.many(userRole),
}));

export const role = pgTable(
	"role",
	{
		id: smallint().primaryKey().generatedAlwaysAsIdentity(),
		name: text().notNull(),
		code: text().notNull(),
		managedEntityType: managedEntityTypeEnum() // to which type of managed entity this role belongs to.
			.notNull(),
		...fields("common", "soft-delete"),
	},
	(t) => [
		// uniqueIndex().on(t.name).where(isNull(t.deletedAt)), // todo: needed?
		uniqueIndex().on(t.code).where(isNull(t.deletedAt)),
	],
);

export const roleRelations = relations(role, (r) => ({
	users: r.many(userRole),
	permissions: r.many(rolePermission),
}));

export const userRole = pgTable(
	"user_role",
	{
		id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
		userId: bigint({ mode: "number" })
			.references(() => user.id)
			.notNull(),
		roleId: smallint()
			.references(() => role.id)
			.notNull(),
		managedEntityId: bigint({ mode: "number" })
			.references(() => managedEntity.id)
			.notNull(),
		isActive: boolean().notNull().default(true),
		...fields("common", "soft-delete"),
	},
	(t) => [
		uniqueIndex()
			.on(t.userId, t.roleId, t.managedEntityId)
			.where(isNull(t.deletedAt)),
	],
);

export const userRoleRelations = relations(userRole, (r) => ({
	user: r.one(user, {
		fields: [userRole.userId],
		references: [user.id],
	}),
	role: r.one(role, {
		fields: [userRole.roleId],
		references: [role.id],
	}),
	managedEntity: r.one(managedEntity, {
		fields: [userRole.managedEntityId],
		references: [managedEntity.id],
	}),
}));

export const permission = pgTable(
	"permission",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		code: text().$type<PermissionCode>().notNull(),
		description: text().notNull(),
		...fields("common"), // hard delete
	},
	(t) => [
		// unique().on(t.name), // todo: needed?
		unique().on(t.code),
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
			.references(() => permission.id, { onDelete: "cascade" })
			.notNull(),
		roleId: smallint()
			.references(() => role.id, { onDelete: "cascade" }) // note: but roles can be soft-deleted, so, will need to handle it there.
			.notNull(),
		...fields("common"), // goes hard
	},
	(t) => [unique().on(t.roleId, t.permissionId)],
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
