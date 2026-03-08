import { Router } from "express";
import { requirePermissions } from "@/middlewares/index.js";
import * as controller from "./controller.js";

const router: Router = Router();

router.get("/", controller.getOrganizationTypes);
router.post(
	"/",
	requirePermissions(["organization_type:create"]),
	controller.createOrganizationType,
);

router.get("/:id/children", controller.getOrganizationTypeChildTypes);
router.post(
	"/:id/children/:childId",
	requirePermissions(["organization_type:modify_hierarchy"]),
	controller.addAllowedChildType,
);

// todo: delete (soft) organization type
// todo: delete parent-child organization type relations
// todo: get parents for a organization type
// todo: get children for a organization type

router.get("/:id/roles", controller.getOrganizationTypeRoles);
router.post(
	"/:id/roles",
	requirePermissions(["organization_type:create_role"]),
	controller.createOrganizationTypeRole,
);

export default router;
