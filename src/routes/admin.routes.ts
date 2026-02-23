import { Router } from "express";
import {
	assignRole,
	createOrganization,
	createUser,
} from "../controllers/admin.controller.js";

const router: Router = Router();

router.post("/users", createUser);
router.post("/organizations", createOrganization);
router.post("/roles", assignRole);

export default router;
