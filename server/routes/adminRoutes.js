import { Router } from "express";
import {
  deleteEmployer,
  deleteJob,
  deleteUser,
  getDashboardStats,
  getJobHistory,
  getEmployers,
  getJobs,
  getUsers,
  toggleUserStatus,
  updateUserRole,
} from "../controllers/adminController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/stats", protect, authorizeRoles("admin"), getDashboardStats);
router.get("/users", protect, authorizeRoles("admin"), getUsers);
router.patch("/users/:id/role", protect, authorizeRoles("admin"), updateUserRole);
router.patch("/users/:id/status", protect, authorizeRoles("admin"), toggleUserStatus);
router.delete("/users/:id", protect, authorizeRoles("admin"), deleteUser);
router.get("/jobs", protect, authorizeRoles("admin"), getJobs);
router.get("/jobs/:id/history", protect, authorizeRoles("admin"), getJobHistory);
router.delete("/jobs/:id", protect, authorizeRoles("admin"), deleteJob);
router.get("/employers", protect, authorizeRoles("admin"), getEmployers);
router.delete("/employers/:id", protect, authorizeRoles("admin"), deleteEmployer);

export default router;
