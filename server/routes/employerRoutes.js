import { Router } from "express";
import {
  getEmployerById,
  getEmployerDashboard,
  getEmployers,
  getMyEmployerProfile,
  upsertMyEmployerProfile,
} from "../controllers/employerController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.route("/profile").get(protect, authorizeRoles("employer", "admin"), getMyEmployerProfile).post(protect, authorizeRoles("employer", "admin"), upsertMyEmployerProfile).put(protect, authorizeRoles("employer", "admin"), upsertMyEmployerProfile);
router.get("/dashboard", protect, authorizeRoles("employer", "admin"), getEmployerDashboard);
router.get("/", protect, authorizeRoles("admin"), getEmployers);
router.get("/:id", protect, authorizeRoles("admin"), getEmployerById);

export default router;

