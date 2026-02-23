import express, { type Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticateToken } from "../middlewares/auth.js";

const router: Router = express.Router();

<<<<<<< HEAD:src/routes/auth.routes.ts
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
=======
router.post("/login", userController.login);
router.post("/refresh", userController.refresh);
>>>>>>> 6e7e8cb (minor cleanup: organizing imports, better practices):src/routes/user.routes.ts

router.use(authenticateToken);
router.get("/me", authController.userDetails);

export default router;
