import { Router } from "express";
import { requireUserType } from "@/middlewares/index.js";
import * as controller from "./controller.js";

const router: Router = Router();

// todo: enforce permissions

router.get("/", controller.getOrganizations);
router.post("/", requireUserType(["admin"]), controller.createOrganization);

router.get("/:id/members", controller.getOrganizationMembers);
router.post(
	"/:id/members",
	requireUserType(["admin"]),
	controller.addMemberToOrganization,
);

export default router;
