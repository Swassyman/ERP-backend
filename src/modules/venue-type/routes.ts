import { Router } from "express";
import { requirePermissions } from "@/middlewares/index.js";
import * as controller from "./controller.js";

const router: Router = Router();

router.get("/", controller.getVenueTypes);
router.post(
	"/",
	requirePermissions(["venue_type:create"]),
	controller.createVenueType,
);

// todo: delete (soft) organization type

router.get("/:id/roles", controller.getVenueTypeRoles);
router.post(
	"/:id/roles",
	requirePermissions(["venue_type:create_role"]),
	controller.createVenueTypeRole,
);

export default router;
