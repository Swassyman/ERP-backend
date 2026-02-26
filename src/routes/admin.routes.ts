import { Router } from "express";
import {
	assignRole,
	createOrganization,
	createUser,
	getOrganizations,
	getRoles,
	getUsers,
} from "../controllers/admin.controller.js";
import { requireUserType } from "../middlewares/require-user-type.js";

const router: Router = Router();

// todo: all these routes aren't really admin-only. it needs to be split into resource specific controllers.
router.use(requireUserType(["admin"]));

router.get("/users", getUsers);
router.post("/users", createUser);

router.get("/organizations", getOrganizations);
router.post("/organizations", createOrganization);

router.get("/roles", getRoles);
router.post("/roles", assignRole); // todo: POST /roles isn't appropriate here for assigning.

export default router;
