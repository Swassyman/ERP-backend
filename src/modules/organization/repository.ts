import { and, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/db/index.js";
import { unreachable } from "@/utilities/helpers.js";

export async function createOrganization(data: {
	name: string;
	organizationTypeId: number;
	parentOrganizationId: number | null | undefined;
}) {
	const newOrg = db.$with("new_org").as(
		db
			.insert(schema.organization)
			.values({
				name: data.name,
				organizationTypeId: data.organizationTypeId,
				parentOrganizationId: data.parentOrganizationId ?? null,
			})
			.returning({ id: schema.organization.id }),
	);
	const [inserted] = await db
		.with(newOrg)
		.insert(schema.managedEntity)
		.values({
			managedEntityType: "organization",
			refId: sql`(select id from ${newOrg})`,
		})
		.returning({ id: newOrg.id });

	if (inserted == null) unreachable();

	return inserted;
}

export async function getOrganizations() {
	return await db.query.organization.findMany({
		where: isNull(schema.organization.deletedAt),
		columns: {
			id: true,
			name: true,
			organizationTypeId: true,
			parentOrganizationId: true,
			isActive: true,
			createdAt: true,
		},
	});
}

export async function findOrganizationManagedEntity(organizationId: number) {
	const [relatedManagedEntity] = await db
		.select({ id: schema.managedEntity.id })
		.from(schema.managedEntity)
		.where(
			and(
				eq(schema.managedEntity.managedEntityType, "organization"),
				eq(schema.managedEntity.refId, organizationId),
				isNull(schema.managedEntity.deletedAt),
			),
		)
		.limit(1);

	return relatedManagedEntity;
}

export async function getOrganizationMembers(managedEntityId: number) {
	// todo: do I need to check whether the org exist? think
	return await db.query.userRole.findMany({
		where: and(
			eq(schema.userRole.managedEntityId, managedEntityId),
			isNull(schema.userRole.deletedAt),
		),
		columns: {
			id: true,
			isActive: true,
			roleId: true,
		},
		with: {
			user: {
				columns: {
					id: true,
					fullName: true,
					email: true,
				},
			},
		},
	});
}

export async function addOrganizationMember(data: {
	managedEntityId: number;
	userId: number;
	roleId: number;
}) {
	const [inserted] = await db
		.insert(schema.userRole)
		.values({
			managedEntityId: data.managedEntityId,
			userId: data.userId,
			roleId: data.roleId,
		})
		.returning({ id: schema.userRole.id });

	if (inserted == null) unreachable();

	return inserted;
}
