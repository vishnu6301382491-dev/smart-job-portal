import { Router } from "express";
import {
  createJob,
  deleteJob,
  getJobById,
  getMyJobs,
  listJobs,
  updateJob,
} from "../controllers/jobController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.route("/").get(listJobs).post(protect, authorizeRoles("employer", "admin"), createJob);
router.get("/my", protect, authorizeRoles("employer", "admin"), getMyJobs);
router.route("/:id").get(getJobById).put(protect, authorizeRoles("employer", "admin"), updateJob).delete(protect, authorizeRoles("employer", "admin"), deleteJob);

export default router;

