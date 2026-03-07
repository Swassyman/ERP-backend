import { asyncHandler } from "@/lib/async-handler.js";
import { ok } from "@/lib/helpers.js";
import { permissionScopedSchema } from "./schema.js";
import * as service from "./service.js";

export const getPermissions = asyncHandler<
	{
		id: number;
		code: PermissionCode;
		description: string;
	}[]
>(async (_req, res) => {
	const result = await service.getPermissions();
	return ok(res, result);
});

export const getPermission = asyncHandler<{
	id: number;
	code: PermissionCode;
	description: string;
}>(async (req, res) => {
	const params = permissionScopedSchema.parse(req.params);
	const result = await service.getPermission(params.id);
	return ok(res, result);
});
