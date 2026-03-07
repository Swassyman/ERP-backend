import { ERROR_CODES } from "@/lib/errors.js";

export function requireUserType(userTypes: UserType[]): ApiRequestHandler {
	return (req, res, next) => {
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
