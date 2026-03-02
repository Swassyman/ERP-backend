import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../config/db.js";
import type { ApiRequestHandler, PermissionCode } from "../config/types.js";
import { ERROR_CODES } from "../utilities/errors.js";
import { unreachable } from "../utilities/helpers.js";

const roleScopedSchema = z
	.object({
		id: z.coerce
			.number({ error: "Invalid role ID" })
			.int({ error: "Invalid role ID" }),
	})
	.strict();

export const getRolePermissions: ApiRequestHandler<
	{
		permissions: {
			id: number;
			code: PermissionCode;
			description: string;
		}[];
	},
	{ id: string }
> = async (req, res) => {
	const parsedParams = roleScopedSchema.safeParse(req.params);

	if (!parsedParams.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: parsedParams.error.message,
		});
	}

	const rolePermissions = await db.query.rolePermission.findMany({
		where: and(
			eq(schema.rolePermission.roleId, parsedParams.data.id),
			// no deletedAt here.
		),
		columns: {},
		with: {
			permission: {
				columns: {
					id: true,
					code: true,
					description: true,
				},
			},
		},
	});

	return res.status(200).json({
		success: true,
		data: {
			permissions: rolePermissions.map((rp) => rp.permission),
		},
	});
};

const rolePermissionScopedSchema = roleScopedSchema
	.extend({
		permissionId: z.coerce
			.number({ error: "Invalid permission ID" })
			.int({ error: "Invalid permission ID" }),
	})
	.strict();

export const assignPermissionToRole: ApiRequestHandler<
	{ id: number },
	{ id: string; permissionId: string }
> = async (req, res) => {
	const parsedParams = rolePermissionScopedSchema.safeParse(req.params);

	if (!parsedParams.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: parsedParams.error.message,
		});
	}

	const [inserted] = await db
		.insert(schema.rolePermission)
		.values({
			roleId: parsedParams.data.id,
			permissionId: parsedParams.data.permissionId,
		})
		.returning({ id: schema.rolePermission.id });

	if (inserted == null) {
		unreachable();
	}

	return res.status(200).json({
		success: true,
		data: {
			id: inserted.id,
		},
	});
};

export const unassignPermissionToRole: ApiRequestHandler<
	undefined,
	{ id: string; permissionId: string }
> = async (req, res) => {
	const parsedParams = rolePermissionScopedSchema.safeParse(req.params);

	if (!parsedParams.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: parsedParams.error.message,
		});
	}

	await db
		.delete(schema.rolePermission)
		.where(
			and(
				eq(schema.rolePermission.roleId, parsedParams.data.id),
				eq(
					schema.rolePermission.permissionId,
					parsedParams.data.permissionId,
				),
			),
		)
		.returning({ id: schema.rolePermission.id });

	return res.status(200).json({
		success: true,
		data: undefined,
	});
};
