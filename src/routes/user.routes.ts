import express, { type Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticateToken } from "../middlewares/auth.js";

const router: Router = express.Router();

router.post("/login", userController.login);
router.post("/refresh", userController.refresh);
router.use(authenticateToken);
router.get("/me", userController.userDetails);

export default router;
