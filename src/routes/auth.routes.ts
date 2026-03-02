import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticateToken } from "../middlewares/index.js";

const router: Router = Router();

router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

router.use(authenticateToken);
router.get("/me", authController.userDetails);

export default router;
