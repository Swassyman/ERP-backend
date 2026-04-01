import { type HasDefault, isNull, type NotNull, or, relations, sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	bigint,
	boolean,
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
	EVENT_STATUS,
	EVENT_ORGANIZER_ROLES,
	EVENT_ORGANIZER_INVITATION_STATUS,
} from "@/lib/constants.js";
import { buildCheck } from "./checks.js";
import { readFile } from "node:fs/promises";
import { time } from "node:console";

// todo: how about switching to string based ids?

// === Enums
export const userTypeEnum = pgEnum("user_type", USER_TYPES);
export const managedEntityTypeEnum = pgEnum("managed_entity_type", MANAGED_ENTITY_TYPES);
export const venueAccessLevelEnum = pgEnum("venue_access_level", VENUE_ACCESS_LEVELS);
export const eventStatusEnum = pgEnum("event_status", EVENT_STATUS);
export const eventOrganizerRoleEnum = pgEnum("event_organizer_role", EVENT_ORGANIZER_ROLES);
export const eventOrganizerInvitationStatusEnum = pgEnum(
	"event_organizer_inivitation_status",
	EVENT_ORGANIZER_INVITATION_STATUS,
);
// === Tables
export const managedEntity = pgTable(
	"managed_entity",
	{
		id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
		managedEntityType: managedEntityTypeEnum().notNull(),
		refId: integer().notNull(),
		...fields("common", "soft-delete"),
	},
	(t) => [uniqueIndex().on(t.managedEntityType, t.refId).where(isNull(t.deletedAt))],
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
		buildCheck(
			"user:email_must_belong_to_institution",
			sql`${t.email} LIKE '%@${sql.raw(INSTITUTION_DOMAIN)}'`,
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
		uniqueIndex().on(t.name, t.managedEntityType, t.typeRefId).where(isNull(t.deletedAt)),
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
	(t) => [uniqueIndex().on(t.userId, t.roleId, t.managedEntityId).where(isNull(t.deletedAt))],
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
		permissionId: integer()
			.references(() => permission.id, { onDelete: "cascade" })
			.notNull(),
		roleId: smallint()
			.references(() => role.id, { onDelete: "cascade" }) // note: but roles can be soft-deleted, so, will need to handle it there.
			.notNull(),
		...fields("common"), // goes hard
	},
	(t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
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
		parentOrganizationId: integer().references((): AnyPgColumn => organization.id),
		isActive: boolean().notNull().default(true),
		...fields("common", "soft-delete"),
	},
	(t) => [uniqueIndex().on(t.organizationTypeId, t.name).where(isNull(t.deletedAt))],
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
		uniqueIndex().on(t.venueTypeId, t.name).where(isNull(t.deletedAt)),
		buildCheck(
			"venue:unavailability_reason_presence",
			sql`${t.isAvailable} = (NULLIF(${t.unavailabilityReason}, '') IS NULL)`,
		),
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

export const eventType = pgTable(
	"event_type",
	{
		id: smallint().primaryKey().generatedAlwaysAsIdentity(),
		eventTypeName: text().notNull(), //program/event or what type of event?
		/*workflowid: integer()
			.references(() => workflow.id)
			.notNull(),*/
		...fields("common", "soft-delete"),
	},
	(t) => [unique().on(t.eventTypeName)],
);

export const event = pgTable(
	"event",
	{
		id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
		eventName: text().notNull(),
		eventTypeId: smallint()
			.references(() => eventType.id)
			.notNull(),
		expectedParticipants: integer().notNull(),
		requestDetails: text().notNull(),
		status: eventStatusEnum().notNull(),
		programId: bigint({ mode: "number" }).references((): AnyPgColumn => event.id),
		startsAt: timestamp({ mode: "date", withTimezone: true }).notNull(),
		endsAt: timestamp({ mode: "date", withTimezone: true }).notNull(),
		...fields("common", "soft-delete"),
	},
	(t) => [
		buildCheck("event:ends_after_starts", sql`${t.endsAt} > ${t.startsAt}`),
		buildCheck("event:min_participants", sql`${t.expectedParticipants}>0`),
		buildCheck("event:unique_to_program", sql`${t.programId} != ${t.id} `),
	],
);

export const eventRelations = relations(event, (r) => ({
	eventType: r.one(eventType, {
		fields: [event.eventTypeId],
		references: [eventType.id],
	}),
	venueAllotments: r.many(venueAllotment),
	organizers: r.many(eventOrganizer),
	invitations: r.many(eventOrganizerInvitation),
	report: r.one(eventReport, {
		fields: [event.id],
		references: [eventReport.eventId],
	}),
}));

export const venueAllotment = pgTable(
	"venue_allotment",
	{
		id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
		venueId: integer()
			.references(() => venue.id, { onDelete: "cascade" })
			.notNull(),
		eventId: bigint({ mode: "number" })
			.references(() => event.id, { onDelete: "cascade" })
			.notNull(),
		startsAt: timestamp({ mode: "date", withTimezone: true }).notNull(),
		endsAt: timestamp({ mode: "date", withTimezone: true }).notNull(),
		...fields("common", "soft-delete"),
	},
	(t) => [buildCheck("venue_allotment:ends_after_starts", sql`${t.endsAt} > ${t.startsAt}`)],
);

export const venueAllotmentRelations = relations(venueAllotment, (r) => ({
	event: r.one(event, {
		fields: [venueAllotment.eventId],
		references: [event.id],
	}),
	venue: r.one(venue, {
		fields: [venueAllotment.venueId],
		references: [venue.id],
	}),
}));

export const eventOrganizer = pgTable(
	"event_organizer",
	{
		id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
		eventId: bigint({ mode: "number" })
			.references(() => event.id, { onDelete: "cascade" })
			.notNull(),
		organizationId: integer()
			.references(() => organization.id, { onDelete: "cascade" })
			.notNull(),
		role: eventOrganizerRoleEnum().notNull(),
		...fields("common", "soft-delete"),
	},
	(t) => [unique().on(t.eventId, t.organizationId)],
);

export const eventOrganizerRelations = relations(eventOrganizer, (r) => ({
	event: r.one(event, {
		fields: [eventOrganizer.eventId],
		references: [event.id],
	}),
	organization: r.one(organization, {
		fields: [eventOrganizer.organizationId],
		references: [organization.id],
	}),
}));

export const eventOrganizerInvitation = pgTable(
	"event_organizer_invitation",
	{
		id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
		eventId: bigint({ mode: "number" })
			.references(() => event.id, { onDelete: "cascade" })
			.notNull(),
		invitedAt: timestamp({ mode: "date", withTimezone: true }).defaultNow(),
		inviter: bigint({ mode: "number" })
			.references(() => userRole.id, { onDelete: "cascade" })
			.notNull(),
		invitee: integer()
			.references(() => organization.id, { onDelete: "cascade" })
			.notNull(),
		status: eventOrganizerInvitationStatusEnum().default("Pending").notNull(),
		respondedAt: timestamp({ mode: "date", withTimezone: true }),
		...fields("common", "soft-delete"),
	},
	(t) => [
		unique().on(t.eventId, t.invitee, t.respondedAt).nullsNotDistinct(),
		buildCheck("event_organizer_invitation:to_self", sql`${t.invitee} !=${t.inviter}`),
		buildCheck(
			"event_organizer_invitation:status_update",
			sql`
			(${t.status} = 'Pending' AND ${t.respondedAt} is NULL)
			OR
			(${t.status} IN ('Accepted', 'Rejected') AND ${t.respondedAt} IS NOT NULL)`,
		),
	],
);

export const eventOrganizerInvitationRelations = relations(eventOrganizerInvitation, (r) => ({
	event: r.one(event, {
		fields: [eventOrganizerInvitation.eventId],
		references: [event.id],
	}),
	inviter: r.one(userRole, {
		fields: [eventOrganizerInvitation.inviter],
		references: [userRole.id],
	}),
	invitee: r.one(organization, {
		fields: [eventOrganizerInvitation.invitee],
		references: [organization.id],
	}),
}));

export const eventReport = pgTable(
	"event_report",
	{
		id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
		eventId: bigint({ mode: "number" })
			.references(() => event.id, { onDelete: "cascade" })
			.notNull(),
		details: text().notNull(),
		submittedAt: timestamp({ mode: "date", withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [unique().on(t.eventId)],
);

export const eventReportRelations = relations(eventReport, (r) => ({
	event: r.one(event, {
		fields: [eventReport.eventId],
		references: [event.id],
	}),
}));

// === Helpers
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
			createdAt: timestamp({ mode: "string", withTimezone: true }).defaultNow().notNull(),
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
