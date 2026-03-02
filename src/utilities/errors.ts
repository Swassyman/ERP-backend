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
}
