import { Router } from "express";
import * as controller from "../controllers/venues.controller.js";
import { authenticateToken, requireUserType } from "../middlewares/index.js";

const router: Router = Router();

// todo: enforce permissions

router.use(authenticateToken);

router.get("/", controller.getVenues);
router.post("/", requireUserType(["admin"]), controller.createVenue);

router.get("/:id/members", controller.getVenueMembers);
router.post(
	"/:id/members",
	requireUserType(["admin"]),
	controller.addMemberToVenue,
);

router.get("/:id/facilities", controller.getVenueFacilities);
router.post(
	"/:id/facilities/:facilityId",
	requireUserType(["admin"]),
	controller.assignFacilityToVenue,
);
router.delete(
	"/:id/facilities/:facilityId",
	requireUserType(["admin"]),
	controller.unassignFacilityToVenue,
);

export default router;
