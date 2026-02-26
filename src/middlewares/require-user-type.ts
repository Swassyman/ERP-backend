import type { NextFunction, Request, RequestHandler } from "express";
import type { ApiResponse, UserType } from "../config/types.js";
import { ERROR_CODES } from "../utilities/errors.js";

export function requireUserType(userTypes: UserType[]): RequestHandler {
	return (req: Request, res: ApiResponse, next: NextFunction) => {
		if (req.user == null) {
			return res.status(401).json({
				success: false,
				code: ERROR_CODES.unauthorized,
				message: "Unauthorized",
			});
		}

		if (userTypes.includes(req.user.type)) {
			return next();
		} else {
			return res.status(403).json({
				success: false,
				code: ERROR_CODES.forbidden,
				message: "You have no access",
			});
		}
	};
}
