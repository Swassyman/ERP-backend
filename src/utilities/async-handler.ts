export function asyncHandler<T = unknown, P = unknown, B = unknown>(
	fn: ApiRequestHandler<T, P, B>,
): ApiRequestHandler<T, P, B> {
	return async (req, res, next) => {
		try {
			await fn(req, res, next);
		} catch (error) {
			next(error);
		}
	};
}
