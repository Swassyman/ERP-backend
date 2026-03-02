import { Router } from "express";
import * as controller from "../controllers/organizations.controller.js";
import { requireUserType, authenticateToken } from "../middlewares/index.js";

const router: Router = Router();

// todo: enforce permissions

router.use(authenticateToken);
router.use(requireUserType(["admin"]));

router.get("/", controller.getOrganizations);
router.post("/", controller.createOrganization);

router.get("/:id/members", controller.getOrganizationMembers);
router.post("/:id/members", controller.addMemberToOrganization);

export default router;
