export const ERROR_CODES = {
	validation_error: "VALIDATION_ERROR",
	invalid_credentials: "INVALID_CREDENTIALS",
	not_found: "NOT_FOUND",
	unauthorized: "UNAUTHORIZED",
	already_exists: "ALREADY_EXISTS",
	internal_server_error: "INTERNAL_SERVER_ERROR",
	forbidden: "FORBIDDEN",
	conflict: "CONFLICT",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class UnreachableError extends Error {
	constructor() {
		super("Unreachable");
	}
}

export class AppError extends Error {
	constructor(
		public statusCode: number,
		public errorCode: ErrorCode,
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
