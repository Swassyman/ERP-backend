import express, { type Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticateToken } from "../middlewares/auth.js";

const router: Router = express.Router();

router.post("/login", authController.login);
router.post("/refresh", authController.refresh);

router.use(authenticateToken);
router.get("/me", authController.userDetails);
router.get("/logout", authController.logout);

export default router;
