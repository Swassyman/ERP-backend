import { Router } from "express";
import * as controller from "../controllers/organization-types.controller.js";

const router: Router = Router();

router.get("/", controller.getOrganizationTypes);
router.post(
	"/",
	// requireUserType(["admin"]), todo: uncomment
	controller.createOrganizationType,
);

router.post("/:id/allow-children/:childId", controller.addAllowedParent);

export default router;
