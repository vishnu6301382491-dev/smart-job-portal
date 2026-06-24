import { Router } from "express";
import {
  getAppliedJobs,
  getMe,
  getNotificationSummary,
  getNotifications,
  getPublicProfile,
  getSavedJobs,
  markAllNotificationsRead,
  markNotificationRead,
  removeSavedJob,
  sendNotificationDigest,
  saveJob,
  updateProfile,
  uploadResume as uploadResumeHandler,
  deleteNotification,
} from "../controllers/userController.js";
import resumeUpload from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);
router.post("/resume", protect, resumeUpload.single("resume"), uploadResumeHandler);
router.get("/applied-jobs", protect, getAppliedJobs);
router.get("/saved-jobs", protect, getSavedJobs);
router.post("/saved-jobs/:jobId", protect, saveJob);
router.delete("/saved-jobs/:jobId", protect, removeSavedJob);
router.get("/notifications", protect, getNotifications);
router.get("/notifications/summary", protect, getNotificationSummary);
router.patch("/notifications/read-all", protect, markAllNotificationsRead);
router.patch("/notifications/:id/read", protect, markNotificationRead);
router.delete("/notifications/:id", protect, deleteNotification);
router.post("/notifications/digest", protect, sendNotificationDigest);
router.get("/:id", protect, getPublicProfile);

export default router;
