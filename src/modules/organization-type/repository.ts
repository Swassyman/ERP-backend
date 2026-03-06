import { and, asc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/config/db.js";
import { unreachable } from "@/utilities/helpers.js";

export async function getOrganizationTypes() {
	return await db
		.select({
			id: schema.organizationType.id,
			name: schema.organizationType.name,
		})
		.from(schema.organizationType)
		.where(isNull(schema.organizationType.deletedAt))
		.orderBy(schema.organizationType.createdAt);
}

export async function createOrganizationType(data: { name: string }) {
	const [inserted] = await db
		.insert(schema.organizationType)
		.values({ name: data.name })
		.returning({ id: schema.organizationType.id });

	if (inserted == null) unreachable();

	return inserted;
}

export async function getOrganizationTypeChildrenTypes(
	organizationTypeId: number,
) {
	return await db
		.select({
			id: schema.organizationTypeAllowedParent.childTypeId,
			name: schema.organizationType.name,
		})
		.from(schema.organizationTypeAllowedParent)
		.innerJoin(
			schema.organizationType,
			eq(
				schema.organizationTypeAllowedParent.childTypeId,
				schema.organizationType.id,
			),
		)
		.where(
			eq(schema.organizationTypeAllowedParent.parentTypeId, organizationTypeId),
			// note: no need of soft-check
		)
		.orderBy(schema.organizationTypeAllowedParent.createdAt);
}

export async function addAllowedChildType(data: {
	parentTypeId: number;
	childTypeId: number;
}) {
	const [inserted] = await db
		.insert(schema.organizationTypeAllowedParent)
		.values({
			parentTypeId: data.parentTypeId,
			childTypeId: data.childTypeId,
		})
		.returning({
			parentTypeId: schema.organizationTypeAllowedParent.parentTypeId,
			childTypeId: schema.organizationTypeAllowedParent.childTypeId,
		});

	if (inserted == null) unreachable();

	return inserted;
}

export async function getOrganizationTypeRoles(organizationTypeId: number) {
	return await db
		.select({
			id: schema.role.id,
			name: schema.role.name,
		})
		.from(schema.role)
		.where(
			and(
				eq(schema.role.managedEntityType, "organization"),
				eq(schema.role.typeRefId, organizationTypeId),
				isNull(schema.role.deletedAt),
			),
		)
		.orderBy(asc(schema.role.createdAt));
}

export async function createOrganizationTypeRole(
	organizationTypeId: number,
	data: {
		name: string;
	},
) {
	const [inserted] = await db
		.insert(schema.role)
		.values({
			name: data.name,
			managedEntityType: "organization",
			typeRefId: organizationTypeId,
		})
		.returning({ id: schema.role.id });

	if (inserted == null) unreachable();

	return inserted;
}
