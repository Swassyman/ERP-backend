import express from "express";
import * as userController from "../controllers/user.controller";
import { authenticateToken } from "../middlewares/auth";

const router = express.Router();

router.post("/login", userController.login);

router.use(authenticateToken);

export default router;
