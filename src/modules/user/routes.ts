import { Router } from "express";
import { authenticateToken, requireUserType } from "@/middlewares/index.js";
import * as controller from "./controller.js";

const router: Router = Router();

// todo: enforce permissions

router.use(authenticateToken);
router.use(requireUserType(["admin"]));

router.get("/", controller.getUsers);
router.post("/", controller.createUser);

export default router;
