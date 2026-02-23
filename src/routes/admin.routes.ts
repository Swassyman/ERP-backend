import { Router } from "express";
import {
	assignRole,
	createOrganization,
	createUser,
	getOrganizations,
	getRoles,
	getUsers,
} from "../controllers/admin.controller.js";

const router: Router = Router();

router.get("/users", getUsers);
router.post("/users", createUser);

router.get("/organizations", getOrganizations);
router.post("/organizations", createOrganization);

router.get("/roles", getRoles);
router.post("/roles", assignRole);

export default router;
