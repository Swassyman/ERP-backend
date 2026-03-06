import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError, ERROR_CODES, UnreachableError } from "@/utilities/errors.js";

// todo: revisit as "error handling" update
export const errorHandler: ErrorRequestHandler = (
	error: Error,
	_req,
	res: ApiResponse,
	_next,
) => {
	if (error instanceof ZodError) {
		return res.status(422).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: error.message, // todo: handle this more gracefully, add meta and return all errors
		});
	} else if (error instanceof AppError) {
		return res.status(error.statusCode).json({
			success: false,
			code: error.errorCode,
			message: error.message,
		});
	}

	if (error instanceof UnreachableError) {
		console.error(
			"To have triggered this, that means something really horrible happened.",
			"Check into this and fix this and this has to be fixed application-wide.",
		);
	}

	console.error(error);

	return res.status(500).json({
		success: false,
		code: ERROR_CODES.internal_server_error,
		message: "Something went wrong",
	});
};
