import { ForbiddenError, UnauthorizedError } from "@/lib/errors.js";

// note: unused
export function requireUserType(userTypes: UserType[]): ApiRequestHandler {
	return (req, _res, next) => {
		if (req.user == null) {
			throw new UnauthorizedError("Unauthorized");
		}

		if (userTypes.includes(req.user.type)) {
			return next();
		} else {
			throw new ForbiddenError("You have no access");
		}
	};
}
