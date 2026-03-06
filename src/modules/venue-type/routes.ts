import { Router } from "express";
import { requireUserType } from "@/middlewares/index.js";
import * as controller from "./controller.js";

const router: Router = Router();

router.get("/", controller.getVenueTypes);
router.post("/", requireUserType(["admin"]), controller.createVenueType); // todo: permissions

// todo: delete (soft) organization type

router.get("/:id/roles", controller.getVenueTypeRoles);
router.post(
	"/:id/roles",
	requireUserType(["admin"]),
	controller.createVenueTypeRole,
);

export default router;
