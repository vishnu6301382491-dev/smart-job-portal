import { Router } from "express";
import {
  applyToJob,
  getJobApplicants,
  getMyApplications,
  updateApplicationStatus,
} from "../controllers/applicationController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/me", protect, getMyApplications);
router.post("/:jobId", protect, authorizeRoles("jobseeker", "admin"), applyToJob);
router.get("/job/:jobId", protect, authorizeRoles("employer", "admin"), getJobApplicants);
router.put("/:id/status", protect, authorizeRoles("employer", "admin"), updateApplicationStatus);

export default router;

