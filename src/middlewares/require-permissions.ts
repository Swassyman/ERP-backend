import type { NextFunction, Request, RequestHandler } from "express";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors.js";
import { quickEnv } from "@/lib/helpers.js";

const DEBUG_BYPASS_PERMISSIONS = !!quickEnv("DEBUG_BYPASS_PERMISSIONS", false);

export function requirePermissions(
	permissions: PermissionCode[],
): RequestHandler {
	return (req: Request, _res: ApiResponse, next: NextFunction) => {
		if (DEBUG_BYPASS_PERMISSIONS) {
			return next();
		}

		if (req.user == null) {
			throw new UnauthorizedError("Unauthorized");
		}

		if (req.user.type === "admin") {
			// admin can bypass permissions!
			// note: this implementation is flaky since it only allows "admin" to pass-through.
			// fine for our current implementation, but may become a trouble if new user types are added
			return next();
		}

		const userPermissions = req.user.permissions;

		if (
			permissions.some((permission) => userPermissions.includes(permission))
		) {
			return next();
		} else {
			throw new ForbiddenError(
				"You do not have any required permission for this",
			);
		}
	};
}
