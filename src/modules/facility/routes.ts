import { Router } from "express";
import * as controller from "./controller.js";
import { requirePermissions } from "@/middlewares/require-permissions.js";

const router: Router = Router();

router.get("/", controller.getFacilities);
router.post(
	"/",
	requirePermissions(["facility:create"]),
	controller.createFacility,
);

export default router;
