import { Router } from "express";
import * as controller from "./controller.js";

const router: Router = Router();

router.get("/:id/permissions", controller.getRolePermissions);
router.put("/:id/permissions", controller.setRolePermissions);

export default router;
