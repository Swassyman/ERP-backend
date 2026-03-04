import { isNull } from "drizzle-orm";
import z from "zod";
import { db, schema } from "../config/db.js";
import { ApiRequestHandler } from "../config/types.js";
import { ERROR_CODES } from "../utilities/errors.js";
import { unreachable } from "../utilities/helpers.js";

export const getFacilities: ApiRequestHandler<
	{
		id: number;
		name: string;
	}[]
> = async (_req, res) => {
	const facilities = await db
		.select({
			id: schema.facility.id,
			name: schema.facility.name,
		})
		.from(schema.facility)
		.where(isNull(schema.facility.deletedAt));

	return res.status(200).json({
		success: true,
		data: facilities,
	});
};

export const createFacilitySchema = z.object({
	name: z
		.string({ error: "Invalid facility name" })
		.trim()
		.nonempty({ error: "Facility name cannot be empty" })
		.max(256, {
			error: "Facility name length cannot exceed 256 characters",
		}),
});

export const createFacility: ApiRequestHandler<
	{
		id: number;
	},
	undefined,
	z.infer<typeof createFacilitySchema>
> = async (req, res) => {
	const parsed = createFacilitySchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: parsed.error.message,
		});
	}

	const [inserted] = await db
		.insert(schema.facility)
		.values({
			name: parsed.data.name,
		})
		.returning({ id: schema.facility.id });

	if (inserted == null) {
		unreachable();
	}

	return res.status(200).json({
		success: true,
		data: {
			id: inserted.id,
		},
	});
};
