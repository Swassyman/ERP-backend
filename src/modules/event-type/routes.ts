import { requirePermissions } from "@/middlewares/require-permissions.js";
import { Router } from "express";
import * as controller from "./controller.js";

const router: Router = Router();

router.get("/", controller.getEventType);
router.post("/", requirePermissions(["event_type:create"]), controller.createEventType);
router.delete("/:id", requirePermissions(["event_type:delete"]), controller.deleteEventType);

export default router;
