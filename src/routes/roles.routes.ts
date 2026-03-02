import { Router } from "express";
import * as controller from "../controllers/roles.controller.js";

const router: Router = Router();

router.get("/:id/permissions", controller.getRolePermissions);
router.post(
	"/:id/permissions/:permissionId",
	controller.assignPermissionToRole,
);
router.delete(
	"/:id/permissions/:permissionId",
	controller.unassignPermissionToRole,
);

export default router;
