import { db, schema } from "@/config/db.js";
import { ERROR_CODES } from "@/utilities/errors.js";
import { unreachable } from "@/utilities/helpers.js";
import { and, eq } from "drizzle-orm";
import {
	rolePermissionScopedSchema,
	roleScopedSchema,
	setRolePermissionsSchema,
} from "./schema.js";

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

	const permissions = await db
		.select({
			id: schema.permission.id,
			code: schema.permission.code,
			description: schema.permission.description,
		})
		.from(schema.rolePermission)
		.innerJoin(
			schema.permission,
			eq(schema.rolePermission.permissionId, schema.permission.id),
		)
		.where(
			eq(schema.rolePermission.roleId, parsedParams.data.id),
			// note: no deletedAt
		);

	return res.status(200).json({
		success: true,
		data: {
			permissions: permissions,
		},
	});
};

export const setRolePermissions: ApiRequestHandler<
	{
		permissions: {};
	},
	{ id: string },
	{ permissionIds: string[] }
> = async (req, res) => {
	const parsedParams = roleScopedSchema.safeParse(req.params);
	const parsed = setRolePermissionsSchema.safeParse(req.body);

	if (!parsedParams.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: parsedParams.error.message,
		});
	}
	if (!parsed.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: parsed.error.message,
		});
	}

	const inserted = await db
		.insert(schema.rolePermission)
		.values(
			parsed.data.permissionIds.map(
				(permissionId) =>
					({
						roleId: parsedParams.data.id,
						permissionId: permissionId,
					}) satisfies typeof schema.rolePermission.$inferInsert,
			),
		)
		.returning({
			id: schema.rolePermission.id,
		});

	return res.status(200).json({
		success: true,
		data: {
			permissions: inserted.map((inserted) => ({ id: inserted.id })),
		},
	});
};

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
