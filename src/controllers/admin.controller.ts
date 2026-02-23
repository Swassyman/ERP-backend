import type { Request, Response } from "express";
import { db } from "../config/db.js";
import {
	user,
	organization,
	organizationUserRole,
} from "../config/schema.js";
import { hashPassword } from "../utilities/argon2.js";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
	CREATE_USER_SCHEMA,
	CREATE_ORGANIZATION_SCHEMA,
	ASSIGN_ROLE_SCHEMA,
} from "../constants.js";

type PgError = {
	code?: string;
	cause?: { code?: string };
};

const getPgCode = (error: PgError) => error.code ?? error.cause?.code;

const formatZodErrors = (error: z.ZodError) =>
	error.issues.map((e) => ({
		field: e.path.join("."),
		message: e.message,
	}));

export const createUser = async (req: Request, res: Response) => {
	try {
		const { fullName, email, password } = CREATE_USER_SCHEMA.parse(req.body);

		const passwordHash = await hashPassword(password);

		const [newUser] = await db
			.insert(user)
			.values({ fullName, email, passwordHash })
			.returning({
				id: user.id,
				fullName: user.fullName,
				email: user.email,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			});

		return res
			.status(201)
			.json({ message: "User created successfully.", user: newUser });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res
				.status(400)
				.json({ message: "Invalid request.", errors: formatZodErrors(error) });
		}

		const pgCode = getPgCode(error as PgError);

		if (pgCode === "23505") {
			return res
				.status(409)
				.json({ message: "A user with this email already exists." });
		}

		console.error(error);
		return res.status(500).json({ message: "Internal server error." });
	}
};

export const createOrganization = async (req: Request, res: Response) => {
	try {
		const { name, type, parentOrganizationId } =
			CREATE_ORGANIZATION_SCHEMA.parse(req.body);

		const [newOrg] = await db
			.insert(organization)
			.values({
				name,
				type,
				parentOrganizationId: parentOrganizationId ?? null,
			})
			.returning({
				id: organization.id,
				name: organization.name,
				type: organization.type,
				parentOrganizationId: organization.parentOrganizationId,
				createdAt: organization.createdAt,
			});

		return res.status(201).json({
			message: "Organization created successfully.",
			organization: newOrg,
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res
				.status(400)
				.json({ message: "Invalid request.", errors: formatZodErrors(error) });
		}

		const pgCode = getPgCode(error as PgError);

		if (pgCode === "23505") {
			return res
				.status(409)
				.json({ message: "An organization with this name already exists." });
		}
		if (pgCode === "23503") {
			return res
				.status(400)
				.json({ message: "parentOrganizationId does not exist." });
		}

		console.error(error);
		return res.status(500).json({ message: "Internal server error." });
	}
};

export const assignRole = async (req: Request, res: Response) => {
	try {
		const { userId, roleId, organizationId } = ASSIGN_ROLE_SCHEMA.parse(
			req.body,
		);

		const [assignment] = await db
			.insert(organizationUserRole)
			.values({ userId, roleId, organizationId })
			.returning({
				id: organizationUserRole.id,
				userId: organizationUserRole.userId,
				roleId: organizationUserRole.roleId,
				organizationId: organizationUserRole.organizationId,
				createdAt: organizationUserRole.createdAt,
			});

		return res
			.status(201)
			.json({ message: "Role assigned successfully.", assignment });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res
				.status(400)
				.json({ message: "Invalid request.", errors: formatZodErrors(error) });
		}

		const pgCode = getPgCode(error as PgError);

		if (pgCode === "23505") {
			return res.status(409).json({
				message: "This role is already assigned to the user in this organization.",
			});
		}
		if (pgCode === "23503") {
			return res
				.status(400)
				.json({ message: "userId, roleId, or organizationId does not exist." });
		}

		console.error(error);
		return res.status(500).json({ message: "Internal server error." });
	}
};