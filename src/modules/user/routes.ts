import { Router } from "express";
import { requirePermissions } from "@/middlewares/index.js";
import * as controller from "./controller.js";

const router: Router = Router();

router.get("/", controller.getUsers);
router.post("/", requirePermissions(["user:create"]), controller.createUser);

export default router;
