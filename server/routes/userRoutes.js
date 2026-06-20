import { Router } from "express";
import { getAppliedJobs, getMe, getPublicProfile, updateProfile, uploadResume as uploadResumeHandler } from "../controllers/userController.js";
import resumeUpload from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);
router.post("/resume", protect, resumeUpload.single("resume"), uploadResumeHandler);
router.get("/applied-jobs", protect, getAppliedJobs);
router.get("/:id", protect, getPublicProfile);

export default router;
