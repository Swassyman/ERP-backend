import { Router } from "express";
import { requireUserType } from "@/middlewares/index.js";
import * as controller from "./controller.js";

const router: Router = Router();

// todo: enforce permissions

router.get("/", controller.getVenues);
router.post("/", requireUserType(["admin"]), controller.createVenue);

router.get("/:id/members", controller.getVenueMembers);
router.post(
	"/:id/members",
	requireUserType(["admin"]),
	controller.addMemberToVenue,
);

router.get("/:id/facilities", controller.getVenueFacilities);
router.put("/:id/facilities", controller.setVenueFacilities);

// todo: [un]assign single facility to venue

export default router;
