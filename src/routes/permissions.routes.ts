import { Router } from "express";
import * as controller from "../controllers/permissions.controller.js";

const router: Router = Router();

router.get("/", controller.getPermissions);
router.get("/:id", controller.getPermission);

export default router;
