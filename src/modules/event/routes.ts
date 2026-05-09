import { requirePermissions } from "@/middlewares/require-permissions.js";
import { Router } from "express";
import * as controller from "./controller.js";

const router: Router = Router();

router.post("/", requirePermissions(["event:manage"]), controller.createEvent);
router.get("/", controller.getEvents);
router.patch("/:id", requirePermissions(["event:manage"]), controller.updateEvent);

// router.get("/:id", controller.getEvent);

// router.post(
// 	"/events/:id/venues",
// 	requirePermissions(["event:allot_venue"]),
// 	controller.createVenueAllotment,
// );
