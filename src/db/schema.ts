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
import {
	INSTITUTION_DOMAIN,
	MANAGED_ENTITY_TYPES,
	USER_TYPES,
	VENUE_ACCESS_LEVELS,
} from "@/lib/constants.js";

// todo: how about switching to string based ids?

// === Enums
export const userTypeEnum = pgEnum("user_type", USER_TYPES);
export const managedEntityTypeEnum = pgEnum(
	"managed_entity_type",
	MANAGED_ENTITY_TYPES,
);
export const venueAccessLevelEnum = pgEnum(
	"venue_access_level",
	VENUE_ACCESS_LEVELS,
);

// === Tables
export const managedEntity = pgTable(
	"managed_entity",
	{
		id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
		managedEntityType: managedEntityTypeEnum().notNull(),
		refId: integer().notNull(), // todo: make trigger for check
		...fields("common", "soft-delete"),
	},
	(t) => [
		uniqueIndex().on(t.managedEntityType, t.refId).where(isNull(t.deletedAt)),
	],
	// soft-fk(ref_id) -> organization, venue
);

export const managedEntityRelations = relations(managedEntity, (r) => ({
	members: r.many(userRole),
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
		check(
			"email_check",
			sql`${t.email} LIKE '%@${sql.raw(INSTITUTION_DOMAIN)}`,
		),
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
		managedEntityType:
			managedEntityTypeEnum() // to which type of managed entity this role belongs to.
				.notNull(),
		typeRefId: integer().notNull(), // soft-fk(organizationType, venueType), since roles belong under institution, dept, lab, hall, etc.
		...fields("common", "soft-delete"),
	},
	(t) => [
		uniqueIndex()
			.on(t.name, t.managedEntityType, t.typeRefId)
			.where(isNull(t.deletedAt)),
		// uniqueIndex()
		// 	.on(t.code, t.managedEntityType, t.typeRefId)
		// 	.where(isNull(t.deletedAt)),
		// // check trigger to restrict updating 'code'.
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
	(t) => [unique().on(t.code)],
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
	// soft-fk(roles), roles that comes under this type of organization
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

export const venueType = pgTable(
	"venue_type",
	{
		id: smallint().primaryKey().generatedAlwaysAsIdentity(),
		name: text().notNull(), // lab, hall, auditorium, seminar hall
		...fields("common", "soft-delete"),
	},
	(t) => [uniqueIndex().on(t.name).where(isNull(t.deletedAt))],
);

export const venueTypeRelations = relations(venueType, (r) => ({
	venues: r.many(venue),
	// soft-fk(roles), roles that comes under this type of venue
}));

export const venue = pgTable(
	"venue",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		name: text().notNull(),
		venueTypeId: smallint()
			.references(() => venueType.id)
			.notNull(),
		organizationId: integer().references((): AnyPgColumn => organization.id),
		accessLevel: venueAccessLevelEnum().notNull(),
		isAvailable: boolean().notNull(),
		unavailabilityReason: text(),
		maxCapacity: integer().notNull(),
		isActive: boolean().notNull().default(true),
		...fields("common", "soft-delete"),
	},
	(t) => [
		uniqueIndex().on(t.name).where(isNull(t.deletedAt)), // todo: discuss whether to add 'venueTypeId' to unique
	],
);

export const venueRelations = relations(venue, (r) => ({
	type: r.one(venueType, {
		fields: [venue.venueTypeId],
		references: [venueType.id],
	}),
	organization: r.one(organization, {
		fields: [venue.organizationId],
		references: [organization.id],
	}),
	facilities: r.many(venueFacility),
	// soft-fk(managed_entity)
}));

export const facility = pgTable(
	"facility",
	{
		id: smallint().primaryKey().generatedAlwaysAsIdentity(),
		name: text().notNull(),
		...fields("common", "soft-delete"),
	},
	(t) => [uniqueIndex().on(t.name).where(isNull(t.deletedAt))],
);

export const facilityRelations = relations(facility, (r) => ({
	venues: r.many(venueFacility),
}));

export const venueFacility = pgTable(
	"venue_facility",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		venueId: integer()
			.references(() => venue.id)
			.notNull(),
		facilityId: smallint()
			.references(() => facility.id)
			.notNull(),
		isActive: boolean().notNull().default(true),
		...fields("common"), // todo: soft-delete or no?
	},
	(t) => [unique().on(t.venueId, t.facilityId)],
);

export const venueFacilityRelations = relations(venueFacility, (r) => ({
	venue: r.one(venue, {
		fields: [venueFacility.venueId],
		references: [venue.id],
	}),
	facility: r.one(facility, {
		fields: [venueFacility.facilityId],
		references: [facility.id],
	}),
}));

// === Common fields
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
