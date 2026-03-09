import { Router } from "express";
import { requirePermissions } from "@/middlewares/require-permissions.js";
import * as controller from "./controller.js";

const router: Router = Router();

router.get("/", controller.getFacilities);
router.post(
	"/",
	requirePermissions(["facility:create"]),
	controller.createFacility,
);

export default router;
