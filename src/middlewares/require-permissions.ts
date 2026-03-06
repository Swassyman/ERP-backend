import type { NextFunction, Request, RequestHandler } from "express";
import { ERROR_CODES } from "@/utilities/errors.js";

export function requirePermissions(
	permissions: PermissionCode[],
): RequestHandler {
	return (req: Request, res: ApiResponse, next: NextFunction) => {
		if (req.user == null) {
			return res.status(401).json({
				success: false,
				code: ERROR_CODES.unauthorized,
				message: "Unauthorized",
			});
		}

		// admin can bypass permissions!
		if (req.user.type === "admin") {
			// todo: this implementation is flaky since it only allows "admin" to pass-through.
			// fine for our current implementation, but may become a trouble if new user types are added
			return next();
		}

		const userPermissions = req.user.permissions;

		if (
			permissions.some((permission) => userPermissions.includes(permission))
		) {
			return next();
		} else {
			return res.status(403).json({
				success: false,
				code: ERROR_CODES.forbidden,
				message: "You do not have enough permissions for this",
			});
		}
	};
}
