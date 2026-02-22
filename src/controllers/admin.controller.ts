import type { Request, Response } from "express";
import { db } from "../config/db.js";
import {
	user,
	organization,
	organizationUserRole,
	role,
} from "../config/schema.js";
import { hashPassword } from "../utilities/argon2.js";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

const tkmceEmail = z
	.string()
	.trim()
	.email()
	.regex(/@tkmce\.ac\.in$/);

const CREATE_USER_SCHEMA = z
	.object({
		fullName: z.string().trim().min(1).max(256),
		email: tkmceEmail,
		password: z.string().min(6),
	})
	.strict();

const CREATE_ORGANIZATION_SCHEMA = z
	.object({
		name: z.string().trim().min(1).max(256),
		type: z.enum(["department", "club", "institution"]),
		parentOrganizationName: z.string().trim().min(1).optional(),
	})
	.strict();

const ASSIGN_ROLE_SCHEMA = z
	.object({
		userEmail: tkmceEmail,
		roleName: z.string().trim().min(1),
		organizationName: z.string().trim().min(1),
	})
	.strict();

export const createUser = async (req: Request, res: Response) => {
	const { fullName, email, password } = CREATE_USER_SCHEMA.parse(req.body);

	if (!fullName || !email || !password) {
		return res
			.status(400)
			.json({ message: "fullName, email, and password are required." });
	}

	try {
		const passwordHash = await hashPassword(password);

		const [newUser] = await db
			.insert(user)
			.values({ fullName, email, passwordHash })
			.returning({
				id: sql<string>`${user.id}::text`,
				fullName: user.fullName,
				email: user.email,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			});

		return res
			.status(201)
			.json({ message: "User created successfully.", user: newUser });
	} catch (error: any) {
		const pgCode = error.code ?? error.cause?.code;

		if (pgCode === "23505") {
			return res
				.status(409)
				.json({ message: "A user with this email already exists." });
		}
		if (pgCode === "23514") {
			return res
				.status(400)
				.json({ message: "Email must be a @tkmce.ac.in address." });
		}
		console.error(error);
		return res.status(500).json({ message: "Internal server error." });
	}
};

export const createOrganization = async (req: Request, res: Response) => {
	const { name, type, parentOrganizationName } =
		CREATE_ORGANIZATION_SCHEMA.parse(req.body);

	if (!name || !type) {
		return res.status(400).json({ message: "name and type are required." });
	}

	const validTypes = ["department", "club", "institution"];
	if (!validTypes.includes(type)) {
		return res
			.status(400)
			.json({ message: `type must be one of: ${validTypes.join(", ")}` });
	}

	try {
		if (parentOrganizationName) {
			const existingOrg = await db
				.select({ id: organization.id })
				.from(organization)
				.where(eq(organization.name, parentOrganizationName))
				.limit(1);

			if (!existingOrg[0] || existingOrg.length === 0) {
				return res
					.status(404)
					.json({
						message: `Organization '${parentOrganizationName}' does not exist.`,
					});
			}

			const [newOrg] = await db
				.insert(organization)
				.values({
					name,
					type,
					parentOrganizationId: existingOrg[0].id,
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
		} else {
			const existingOrg = await db
				.select({ id: organization.id })
				.from(organization)
				.where(eq(organization.name, "TKMCE"))
				.limit(1);

			if (!existingOrg[0] || existingOrg.length === 0) {
				return res
					.status(404)
					.json({ message: `Organization TKMCE does not exist.` });
			}

			const [newOrg] = await db
				.insert(organization)
				.values({
					name,
					type,
					parentOrganizationId: existingOrg[0].id,
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
		}
	} catch (error: any) {
		const pgCode = error.code ?? error.cause?.code;

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
	const { userEmail, roleName, organizationName } = ASSIGN_ROLE_SCHEMA.parse(
		req.body,
	);

	if (!userEmail || !roleName || !organizationName) {
		return res
			.status(400)
			.json({
				message: "userEmail, roleName, and organizationName are required.",
			});
	}

	try {
		const existingUser = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.email, userEmail))
			.limit(1);

		if (existingUser.length === 0 || !existingUser[0]) {
			return res
				.status(404)
				.json({ message: `User '${userEmail}' does not exist.` });
		}

		const existingRole = await db
			.select({ id: role.id })
			.from(role)
			.where(eq(role.roleName, roleName))
			.limit(1);

		if (existingRole.length === 0 || !existingRole[0]) {
			return res
				.status(404)
				.json({ message: `Role '${roleName}' does not exist.` });
		}

		const existingOrg = await db
			.select({ id: organization.id })
			.from(organization)
			.where(eq(organization.name, organizationName))
			.limit(1);

		if (existingOrg.length === 0 || !existingOrg[0]) {
			return res
				.status(404)
				.json({
					message: `Organization '${organizationName}' does not exist.`,
				});
		}

		const userId = existingUser[0].id;
		const roleId = existingRole[0].id;
		const organizationId = existingOrg[0].id;

		const [assignment] = await db
			.insert(organizationUserRole)
			.values({ userId, roleId, organizationId })
			.returning({
				id: sql<string>`${organizationUserRole.id}::text`,
				userId: sql<string>`${organizationUserRole.userId}::text`,
				roleId: organizationUserRole.roleId,
				organizationId: organizationUserRole.organizationId,
				createdAt: organizationUserRole.createdAt,
			});

		return res
			.status(201)
			.json({ message: "Role assigned successfully.", assignment });
	} catch (error: any) {
		const pgCode = error.code ?? error.cause?.code;

		if (pgCode === "23505") {
			return res.status(409).json({
				message:
					"This role is already assigned to the user in this organization.",
			});
		}
		if (pgCode === "23503") {
			return res
				.status(400)
				.json({ message: "userId or organizationId does not exist." });
		}
		console.error(error);
		return res.status(500).json({ message: "Internal server error." });
	}
};

