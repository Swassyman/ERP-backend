import { and, eq, isNull } from "drizzle-orm";
import z from "zod";
import { db, schema } from "@/config/db.js";
import { INSTITUTION_DOMAIN_REGEXP } from "@/constants.js";
import { hashPassword } from "@/utilities/argon2.js";
import { ERROR_CODES } from "@/utilities/errors.js";
import { getPgErrorCode, unreachable } from "@/utilities/helpers.js";

const createUserSchema = z
	.object({
		email: z
			.email({ error: "Invalid email" })
			.regex(INSTITUTION_DOMAIN_REGEXP, {
				error: "Email must belong to the institution",
			}),
		password: z
			.string({ error: "Invalid password input" })
			.min(6, { error: "Password must be at least 6 characters long" }),

		fullName: z
			.string({ error: "Invalid name input" })
			.nonempty({ error: "Name cannot be empty" })
			.max(256, { error: "Name cannot exceed 256 characters" }),
	})
	.strict();

export const createUser: ApiRequestHandler<{
	user: {
		id: number;
		fullName: string;
		email: string;
		createdAt: string;
	};
}> = async (req, res) => {
	const parsed = createUserSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: "Invalid details",
		});
	}

	try {
		const [newUser] = await db
			.insert(schema.user)
			.values({
				type: "end_user",
				email: parsed.data.email,
				passwordHash: await hashPassword(parsed.data.password),
				fullName: parsed.data.fullName,
			})
			.returning({
				id: schema.user.id,
				fullName: schema.user.fullName,
				email: schema.user.email,
				createdAt: schema.user.createdAt,
			});

		if (newUser == null) {
			unreachable();
		}

		return res.status(201).json({
			success: true,
			data: { user: newUser },
		});
	} catch (error) {
		const pgErrorCode = getPgErrorCode(error);
		if (pgErrorCode === "23505") {
			return res.status(409).json({
				success: false,
				code: ERROR_CODES.already_exists,
				message: "A user with this email already exists.",
			});
		}

		throw error;
	}
};

export const getUsers: ApiRequestHandler<{
	users: {
		email: string;
		fullName: string;
		id: number;
		isActive: boolean;
		createdAt: string;
		roles: {
			id: number;
			isActive: boolean;
			createdAt: string;
			roleId: number;
			managedEntityId: number;
		}[];
	}[];
}> = async (_req, res) => {
	const users = await db.query.user.findMany({
		where: and(
			eq(schema.user.type, "end_user"),
			isNull(schema.user.deletedAt),
		),
		columns: {
			id: true,
			fullName: true,
			email: true,
			createdAt: true,
			isActive: true,
		},
		with: {
			roles: {
				columns: {
					id: true,
					isActive: true,
					createdAt: true,
					roleId: true,
					managedEntityId: true,
				},
			},
		},
	});

	return res.status(200).json({
		success: true,
		data: {
			users: users,
		},
	});
};
