export enum ERROR_CODES {
	// todo: sort
	validation_error = "VALIDATION_ERROR",
	/** @deprecated Use {@link ERROR_CODES.invalid_credentials} */
	user_not_found = "USER_NOT_FOUND", // todo: get rid of this
	invalid_credentials = "INVALID_CREDENTIALS",
	not_found = "NOT_FOUND",
	unauthorized = "UNAUTHORIZED",
	already_exists = "ALREADY_EXISTS",
	internal_server_error = "INTERNAL_SERVER_ERROR",
	invalid_related_entity = "INVALID_RELATED_ENTITY", // todo: what? make this better
	forbidden = "FORBIDDEN",
	conflict = "CONFLICT",
}

export class UnreachableError extends Error {
	constructor() {
		super("Unreachable");
	}
}

export class AppError extends Error {
	constructor(
		public statusCode: number,
		public errorCode: ERROR_CODES,
		message: string,
	) {
		super(message);
	}
}

export class NotFoundError extends AppError {
	constructor(message: string) {
		super(404, ERROR_CODES.not_found, message);
	}
}

export class ConflictError extends AppError {
	constructor(message: string) {
		super(409, ERROR_CODES.conflict, message);
	}
}

export class ForbiddenError extends AppError {
	constructor(message: string) {
		super(403, ERROR_CODES.forbidden, message);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message: string) {
		super(401, ERROR_CODES.unauthorized, message);
	}
}

export class ValidationError extends AppError {
	constructor(message: string) {
		super(422, ERROR_CODES.validation_error, message);
	}
}
