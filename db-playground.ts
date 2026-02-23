import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "./src/config/db.js";

const newOrg = db.$with("new_org").as(
	db
		.insert(schema.organization)
		.values({
			name: "a",
			organizationTypeId: 1,
			parentOrganizationId: null,
		})
		.returning({
			id: schema.organization.id,
		}),
);
const query = db.with(newOrg).insert(schema.managedEntity).values({
	managedEntityType: "organization",
	refId: 12,
});

const sqlQuery = query.toSQL();
console.log(sqlQuery.sql, sqlQuery.params);
// console.log(await query.execute());
