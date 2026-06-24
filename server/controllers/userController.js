import User from "../models/User.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Notification from "../models/Notification.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { fetchExternalJobs, getExternalJobById, isExternalJobId } from "../utils/externalJobs.js";
import { sendNotificationDigestForUser } from "../utils/notificationDigest.js";

const JOB_POPULATE = {
  path: "employer",
  select: "companyName location website industry",
};

const parseSkills = (skills) => {
  if (!skills) {
    return [];
  }

  if (Array.isArray(skills)) {
    return skills.map((skill) => String(skill).trim()).filter(Boolean);
  }

  return String(skills)
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
};

const parseNotificationPrefs = (notificationPrefs, currentPrefs = {}) => {
  const source =
    notificationPrefs && typeof notificationPrefs === "object" && !Array.isArray(notificationPrefs)
      ? notificationPrefs
      : {};

  const nextPrefs = {
    savedJobUpdates:
      source.savedJobUpdates === undefined
        ? currentPrefs.savedJobUpdates ?? true
        : source.savedJobUpdates === true || source.savedJobUpdates === "true",
    matchedJobs:
      source.matchedJobs === undefined
        ? currentPrefs.matchedJobs ?? true
        : source.matchedJobs === true || source.matchedJobs === "true",
    emailDigests:
      source.emailDigests === undefined
        ? currentPrefs.emailDigests ?? false
        : source.emailDigests === true || source.emailDigests === "true",
    digestFrequency: ["daily", "weekly"].includes(source.digestFrequency)
      ? source.digestFrequency
      : currentPrefs.digestFrequency || "daily",
  };

  if (currentPrefs.lastDigestSentAt) {
    nextPrefs.lastDigestSentAt = currentPrefs.lastDigestSentAt;
  }

  return nextPrefs;
};

const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

const resolveSavedJobs = async (savedJobIds = []) => {
  const localJobIds = savedJobIds.filter((jobId) => !isExternalJobId(jobId));
  const externalJobIds = savedJobIds.filter((jobId) => isExternalJobId(jobId));

  const [localJobs, externalJobs] = await Promise.all([
    localJobIds.length > 0
      ? Job.find({ _id: { $in: localJobIds } })
          .populate(JOB_POPULATE)
          .sort({ createdAt: -1 })
      : [],
    externalJobIds.length > 0 ? fetchExternalJobs() : [],
  ]);

  const localJobMap = new Map(localJobs.map((job) => [String(job._id), job.toJSON()]));
  const externalJobMap = new Map(externalJobs.map((job) => [job._id, job]));

  return savedJobIds
    .map((jobId) => localJobMap.get(jobId) || externalJobMap.get(jobId))
    .filter(Boolean);
};

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const { name, phone, title, location, bio, avatar, skills, notificationPrefs } = req.body;

  user.name = name ?? user.name;
  user.phone = phone ?? user.phone;
  user.title = title ?? user.title;
  user.location = location ?? user.location;
  user.bio = bio ?? user.bio;
  user.avatar = avatar ?? user.avatar;
  user.skills = skills ? parseSkills(skills) : user.skills;
  user.notificationPrefs = parseNotificationPrefs(notificationPrefs, user.notificationPrefs || {});

  const updatedUser = await user.save();

  res.json({
    message: "Profile updated",
    user: updatedUser,
  });
});

const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Resume file is required");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const resumePath = `/uploads/${req.file.filename}`;
  user.resumeUrl = resumePath;
  user.resumeName = req.file.originalname;

  const updatedUser = await user.save();

  res.json({
    message: "Resume uploaded successfully",
    user: updatedUser,
  });
});

const getSavedJobs = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("savedJobs");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const jobs = await resolveSavedJobs(user.savedJobs || []);

  res.json({
    jobs,
    savedJobIds: user.savedJobs || [],
  });
});

const saveJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  if (!jobId) {
    throw new ApiError(400, "Job id is required");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.savedJobs?.includes(jobId)) {
    const jobs = await resolveSavedJobs(user.savedJobs || []);

    res.json({
      message: "Job already saved",
      user,
      jobs,
      saved: true,
    });
    return;
  }

  if (isExternalJobId(jobId)) {
    const job = await getExternalJobById(jobId);

    if (!job) {
      throw new ApiError(404, "Job not found");
    }
  } else {
    const job = await Job.findById(jobId);

    if (!job) {
      throw new ApiError(404, "Job not found");
    }
  }

  user.savedJobs = [...new Set([...(user.savedJobs || []), jobId])];
  const updatedUser = await user.save();
  const jobs = await resolveSavedJobs(updatedUser.savedJobs || []);

  res.json({
    message: "Job saved successfully",
    user: updatedUser,
    jobs,
    saved: true,
  });
});

const removeSavedJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  if (!jobId) {
    throw new ApiError(400, "Job id is required");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.savedJobs = (user.savedJobs || []).filter((savedJobId) => savedJobId !== jobId);
  const updatedUser = await user.save();
  const jobs = await resolveSavedJobs(updatedUser.savedJobs || []);

  res.json({
    message: "Job removed from saved jobs",
    user: updatedUser,
    jobs,
    saved: false,
  });
});

const getAppliedJobs = asyncHandler(async (req, res) => {
  const applications = await Application.find({ applicant: req.user._id })
    .populate({
      path: "job",
      populate: {
        path: "employer",
        select: "companyName location website industry",
      },
    })
    .sort({ createdAt: -1 });

  res.json({ applications });
});

const getPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.json({ user });
});

const sendNotificationDigest = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.notificationPrefs?.emailDigests) {
    throw new ApiError(400, "Email digests are disabled in your preferences");
  }

  const result = await sendNotificationDigestForUser(user);

  res.json({
    message: result.sent ? "Digest email sent" : "No digest email was sent",
    digest: result,
  });
});

const getNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const unreadOnly = req.query.unread === "true";
  const filter = { user: req.user._id };

  if (unreadOnly) {
    filter.readAt = { $exists: false };
  }

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(limit),
    Notification.countDocuments({ user: req.user._id, readAt: { $exists: false } }),
  ]);

  res.json({
    notifications,
    unreadCount,
  });
});

const getNotificationSummary = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({ user: req.user._id, readAt: { $exists: false } });

  res.json({ unreadCount });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  if (!notification.readAt) {
    notification.readAt = new Date();
    await notification.save();
  }

  res.json({ message: "Notification marked as read", notification });
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, readAt: { $exists: false } },
    { $set: { readAt: new Date() } }
  );

  res.json({ message: "Notifications marked as read" });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  res.json({ message: "Notification deleted" });
});

export {
  deleteNotification,
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
  uploadResume,
};
