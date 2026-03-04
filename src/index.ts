import { cors } from "@/middlewares/index.js";
import { ERROR_CODES } from "@/utilities/errors.js";
import { quickEnv } from "@/utilities/helpers.js";
import cookieParser from "cookie-parser";
import express, { type ErrorRequestHandler } from "express";
import * as os from "node:os";
import { styleText } from "node:util";
// end of normal imports, and router imports follow:

import authRouter from "@/modules/auth/routes.js";
import facilitiesRouter from "@/modules/facility/routes.js";
import organizationTypesRouter from "@/modules/organization-type/routes.js";
import organizationRouter from "@/modules/organization/routes.js";
import permissionsRouter from "@/modules/permission/routes.js";
import rolesRouter from "@/modules/role/routes.js";
import usersRouter from "@/modules/user/routes.js";
import venueTypesRouter from "@/modules/venue-type/routes.js";
import venuesRouter from "@/modules/venue/routes.js";

const PORT = Number(process.env.PORT) || 3192;
if (Number.isNaN(PORT) || !Number.isInteger(PORT)) {
	throw new Error("Invalid PORT specified");
}
const FRONTEND_ORIGIN = quickEnv("FRONTEND_ORIGIN");

const app = express();

// todo: rate-limits

app.use((req, res, next) => {
	const id = crypto.randomUUID(); // note: store in req.id
	const path = req.path;
	const timeStart = Date.now();
	console.info(
		styleText("magenta", new Date().toISOString()),
		styleText("dim", id),
		styleText(["bgCyan", "black"], ` ${req.method} `),
		path,
	);
	next();

	const resOk = res.statusCode === 200;
	console.info(
		styleText("magenta", new Date().toISOString()),
		styleText("dim", id),
		styleText(
			[resOk ? "bgGreen" : "bgRed"],
			` ${res.statusCode.toString()} `,
		),
		// path,
		styleText("yellow", `${Date.now() - timeStart}ms`),
	);
});
app.use(
	cors({
		allowedOrigins: [FRONTEND_ORIGIN],
		allowCredentials: true,
		allowedHeaders: ["Accept", "Content-Type", "Authorization"],
		allowedMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
		maxAge: 24 * 60 * 60,
	}),
);
app.use(cookieParser());
app.use(express.json());

// Health
app.get("/", (_req, res) => res.status(200).json({ status: "active" }));

// Routes
app.use("/auth", authRouter);

// app.use(authenticateToken);
app.use("/users", usersRouter);
app.use("/permissions", permissionsRouter);
app.use("/roles", rolesRouter);
app.use("/organizations", organizationRouter);
app.use("/organization-types", organizationTypesRouter);
app.use("/venues", venuesRouter);
app.use("/venue-types", venueTypesRouter);
app.use("/facilities", facilitiesRouter);

// todo: revisit as "error handling" update
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

const HAS_HOST = process.argv.includes("--host");
const HOSTNAME = HAS_HOST
	? "0.0.0.0"
	: (quickEnv("HOSTNAME", false) ?? "localhost");

app.listen(PORT, HOSTNAME, () => {
	const hostnames = new Map<string, boolean>();

	if (HOSTNAME === "0.0.0.0") {
		hostnames.set("localhost", true);
		const interfaces = os.networkInterfaces();
		Object.values(interfaces)
			.filter((addresses) => addresses != null)
			.flatMap((addresses) => {
				return addresses
					.filter((address) => address.family === "IPv4")
					.map(
						(address) =>
							[address.address, address.internal] as const,
					);
			})
			.forEach(([hostname, internal]) =>
				hostnames.set(hostname, internal),
			);
	}

	console.log("Server is now running in the following addresses:\n");
	hostnames.entries().forEach(([hostname, internal]) => {
		console.log(
			"    -> " + (internal ? "Local" : "Network") + ":",
			styleText("blue", `http://${hostname}:${PORT}`),
		);
	});
	console.log();
});
