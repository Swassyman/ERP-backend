import { Router } from "express";
import { requirePermissions } from "@/middlewares/index.js";
import * as controller from "./controller.js";

const router: Router = Router();

router.get("/", controller.getOrganizations);
router.post("/", requirePermissions(["organization:create"]), controller.createOrganization);

router.get("/:id", controller.getOrganization);

router.get("/:id/members", controller.getOrganizationMembers);
router.post(
	"/:id/members",
	requirePermissions(["organization:add_member"]),
	controller.addMemberToOrganization,
);

export default router;
