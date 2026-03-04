import { Router } from "express";
import * as controller from "./controller.js";
import { authenticateToken, requireUserType } from "@/middlewares/index.js";

const router: Router = Router();

// todo: enforce permissions

router.use(authenticateToken);
router.use(requireUserType(["admin"]));

router.get("/", controller.getUsers);
router.post("/", controller.createUser);

export default router;
