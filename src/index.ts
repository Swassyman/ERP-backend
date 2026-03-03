import cookieParser from "cookie-parser";
import express, { type ErrorRequestHandler } from "express";
import type { ApiResponse } from "./config/types.js";
import { ERROR_CODES } from "./utilities/errors.js";
// end of normal imports, and router imports follow:

import authRouter from "./routes/auth.routes.js";
import usersRouter from "./routes/users.routes.js";
import permissionsRouter from "./routes/permissions.routes.js";
import rolesRouter from "./routes/roles.routes.js";
import organizationRouter from "./routes/organizations.routes.js";
import organizationTypesRouter from "./routes/organization-types.routes.js";

const PORT = Number(process.env.PORT) || 3192;
if (Number.isNaN(PORT) || !Number.isInteger(PORT)) {
	throw new Error("Invalid PORT specified");
}

const app = express();

// todo: rate-limits

app.use((req, _res, next) => {
	console.log(new Date().toISOString(), req.method, req.hostname, req.path);
	next();
});

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;
if (
	typeof FRONTEND_ORIGIN !== "string" ||
	FRONTEND_ORIGIN.trim().length === 0
) {
	throw new Error("FRONTEND_ORIGIN must be set");
}

app.use((req, res, next) => {
	if (req.headers.origin === FRONTEND_ORIGIN) {
		res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
		res.setHeader("Access-Control-Allow-Credentials", "true");
		res.setHeader(
			"Access-Control-Allow-Methods",
			"GET,POST,PATCH,PUT,DELETE,OPTIONS",
		);
		res.setHeader(
			"Access-Control-Allow-Headers",
			"Content-Type,Authorization",
		);
	}
	if (req.method === "OPTIONS") {
		res.setHeader("Access-Control-Max-Age", "86400"); // cache pre-flight for 24h
		res.sendStatus(204);
		return;
	}
	next();
});

app.use(cookieParser());
app.use(express.json());

// Health
app.get("/", (_req, res) => res.status(200).json({ status: "active" }));

// Routes
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/permissions", permissionsRouter);
app.use("/roles", rolesRouter);
app.use("/organizations", organizationRouter);
app.use("/organization-types", organizationTypesRouter);

// todo: revisit, also async-errors?
const errorHandler: ErrorRequestHandler = (
	error: Error,
	_req,
	res: ApiResponse,
	_next,
) => {
	console.error(error);

	return res.status(500).json({
		success: false,
		code: ERROR_CODES.internal_server_error,
		message: "Something went wrong",
	});
};

app.use(errorHandler);

app.listen(PORT, "0.0.0.0", () => {
	console.log(`Server listening on port ${PORT} at http://localhost:${PORT}`);
});
