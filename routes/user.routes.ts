import express, { type Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticateToken } from "../middlewares/auth.js";

const router: Router = express.Router();

router.post("/login", userController.login);

router.use(authenticateToken);

export default router;
