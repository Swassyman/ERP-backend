import { Router } from "express";
import { requirePermissions } from "@/middlewares/require-permissions.js";
import * as controller from "./controller.js";

const router: Router = Router();

router.get("/:id/permissions", controller.getRolePermissions);
router.put(
	"/:id/permissions",
	requirePermissions(["role:modify_permissions"]),
	controller.setRolePermissions,
);

export default router;
