import { Router } from "express";
import {
	createOrganizationType,
	getOrganizationTypes,
} from "../controllers/organization-types.controller.js";

const router: Router = Router();

router.get("/organization-types", getOrganizationTypes);
router.post(
	"/organization-types",
	// requireUserType(["admin"]), todo: uncomment
	createOrganizationType,
);

export default router;
