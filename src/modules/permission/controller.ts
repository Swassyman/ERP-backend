import { eq } from "drizzle-orm";
import { db, schema } from "../../config/db.js";
import { ApiRequestHandler, PermissionCode } from "../../config/types.js";
import z from "zod";
import { ERROR_CODES } from "../../utilities/errors.js";

export const getPermissions: ApiRequestHandler<
	{
		id: number;
		code: PermissionCode;
		description: string;
	}[]
> = async (_req, res) => {
	const permissions = await db
		.select({
			id: schema.permission.id,
			code: schema.permission.code,
			description: schema.permission.description,
		})
		.from(schema.permission);

	return res.status(200).json({
		success: true,
		data: permissions,
	});
};

const permissionScope = z
	.object({
		id: z.coerce
			.number({ error: "Invalid permission ID" })
			.int({ error: "Invalid permission ID" }),
	})
	.strict();

export const getPermission: ApiRequestHandler<
	{
		id: number;
		code: PermissionCode;
		description: string;
	},
	{ id: string }
> = async (req, res) => {
	const parsedParams = permissionScope.safeParse(req.params);

	if (!parsedParams.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: parsedParams.error.message,
		});
	}

	const [permission] = await db
		.select({
			id: schema.permission.id,
			code: schema.permission.code,
			description: schema.permission.description,
		})
		.from(schema.permission)
		.where(eq(schema.permission.id, parsedParams.data.id))
		.limit(1);

	if (permission == null) {
		return res.status(404).json({
			success: false,
			code: ERROR_CODES.not_found,
			message: "Permission does not exist",
		});
	}

	return res.status(200).json({
		success: true,
		data: permission,
	});
};
