type CorsOptions = {
	allowedOrigins: string[];
	allowCredentials: boolean;
	allowedMethods: string[];
	allowedHeaders: string[];
	maxAge: number;
};

export function cors(options: CorsOptions): ApiRequestHandler {
	return (req, res, next) => {
		const originHeader = req.headers.origin;
		if (typeof originHeader === "string" && options.allowedOrigins.includes(originHeader)) {
			res.setHeader("Vary", "Origin");
			res.setHeader("Access-Control-Allow-Origin", originHeader);
			res.setHeader("Access-Control-Allow-Credentials", String(!!options.allowCredentials));
			res.setHeader("Access-Control-Allow-Methods", options.allowedMethods.join(","));
			res.setHeader("Access-Control-Allow-Headers", options.allowedHeaders.join(","));
		}
		if (req.method === "OPTIONS") {
			res.setHeader("Access-Control-Max-Age", options.maxAge.toString()); // cache pre-flight for 24h
			res.sendStatus(204);
			return;
		}
		next();
	};
}
