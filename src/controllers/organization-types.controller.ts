import { isNull } from "drizzle-orm";
import z from "zod";
import { db, schema } from "../config/db.js";
import type { ApiRequestHandler } from "../config/types.js";
import { ERROR_CODES } from "../utilities/errors.js";
import { unreachable } from "../utilities/helpers.js";

export const getOrganizationTypes: ApiRequestHandler<{
	organizationTypes: {
		id: number;
		name: string;
		children: {
			childTypeId: number;
		}[];
	}[];
}> = async (_req, res) => {
	const organizationTypes = await db.query.organizationType.findMany({
		where: isNull(schema.organizationType.deletedAt),
		columns: {
			id: true,
			name: true,
			// createdAt: true,
		},
		with: {
			children: {
				columns: {
					childTypeId: true,
					// createdAt: true,
				},
				orderBy: schema.organizationTypeAllowedParent.createdAt,
			},
		},
		orderBy: schema.organizationType.createdAt,
	});

	return res.status(200).json({
		data: {
			organizationTypes: organizationTypes,
		},
	});
};

const createOrganizationTypeSchema = z
	.object({
		name: z
			.string({ error: "Invalid name type" })
			.trim()
			.nonempty({ error: "Name must not be empty" })
			.max(256, { error: "Name cannot be longer than 256 characters" }),
	})
	.strict();

export const createOrganizationType: ApiRequestHandler<{}> = async (
	req,
	res,
) => {
	const parsed = createOrganizationTypeSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({
			code: ERROR_CODES.validation_error,
			message: parsed.error.message,
		});
	}

	const [inserted] = await db
		.insert(schema.organizationType)
		.values({ name: parsed.data.name })
		.returning({ id: schema.organizationType.id });

	if (inserted == null) {
		unreachable();
	}

	return res.status(200).json({
		data: {
			id: inserted.id,
			name: parsed.data.name,
		},
	});
};
