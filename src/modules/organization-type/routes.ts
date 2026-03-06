import { Router } from "express";
import { requireUserType } from "@/middlewares/index.js";
import * as controller from "./controller.js";

const router: Router = Router();

router.get("/", controller.getOrganizationTypes);
router.post("/", requireUserType(["admin"]), controller.createOrganizationType); // todo: permissions

router.get("/:id/children", controller.getOrganizationTypeChildTypes);
router.post(
	"/:id/children/:childId",
	requireUserType(["admin"]),
	controller.addAllowedChildType,
);

// todo: delete (soft) organization type
// todo: delete parent-child organization type relations
// todo: get parents for a organization type
// todo: get children for a organization type

router.get("/:id/roles", controller.getOrganizationTypeRoles);
router.post(
	"/:id/roles",
	requireUserType(["admin"]),
	controller.createOrganizationTypeRole,
);

export default router;
