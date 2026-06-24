import mongoose from "mongoose";
import Job from "../models/Job.js";
import Employer from "../models/Employer.js";
import Application from "../models/Application.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { fetchExternalJobs, getExternalJobById, isExternalJobId } from "../utils/externalJobs.js";
import { notifyMatchingJobs, notifySavedJobDeletion, notifySavedJobFollowers } from "../utils/notificationAlerts.js";
import {
  JOB_STATUSES,
  getJobHistoryAction,
  recordJobHistory,
  snapshotJob,
} from "../utils/jobAudit.js";

const parseList = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseQueryList = (value) => {
  if (!value) {
    return [];
  }

  const items = Array.isArray(value) ? value : String(value).split(",");

  return items.map((item) => String(item).trim()).filter(Boolean);
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildJobQuery = (query) => {
  const filters = {};
  const searchConditions = [];

  if (query.q) {
    searchConditions.push({
      $or: [
        { title: { $regex: query.q, $options: "i" } },
        { description: { $regex: query.q, $options: "i" } },
        { category: { $regex: query.q, $options: "i" } },
        { skills: { $in: [new RegExp(query.q, "i")] } },
      ],
    });
  }

  const selectedSkills = parseQueryList(query.skill ?? query.skills);
  if (selectedSkills.length > 0) {
    searchConditions.push({
      $or: selectedSkills.flatMap((skill) => {
        const escapedSkill = escapeRegex(skill);

        return [
          { skills: { $in: [new RegExp(escapedSkill, "i")] } },
          { title: { $regex: escapedSkill, $options: "i" } },
          { description: { $regex: escapedSkill, $options: "i" } },
          { category: { $regex: escapedSkill, $options: "i" } },
        ];
      }),
    });
  }

  if (searchConditions.length === 1) {
    Object.assign(filters, searchConditions[0]);
  } else if (searchConditions.length > 1) {
    filters.$and = searchConditions;
  }

  if (query.location) {
    filters.location = { $regex: query.location, $options: "i" };
  }

  if (query.jobType) {
    filters.jobType = query.jobType;
  }

  if (query.category) {
    filters.category = { $regex: query.category, $options: "i" };
  }

  if (query.status) {
    filters.status = query.status;
  } else {
    filters.status = "open";
  }

  if (query.remote === "true") {
    filters.remote = true;
  }

  return filters;
};

const listJobs = asyncHandler(async (req, res) => {
  const [localJobs, externalJobs] = await Promise.all([
    Job.find(buildJobQuery(req.query))
    .populate("employer", "companyName logoUrl location website industry")
    .populate("postedBy", "name email")
    .sort({ createdAt: -1 }),
    fetchExternalJobs(req.query),
  ]);

  const jobs = [
    ...localJobs.map((job) => ({
      ...job.toJSON(),
      source: "local",
      external: false,
    })),
    ...externalJobs,
  ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  res.json({ jobs });
});

const getJobById = asyncHandler(async (req, res) => {
  if (isExternalJobId(req.params.id)) {
    const job = await getExternalJobById(req.params.id);

    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    res.json({ job });
    return;
  }

  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, "Invalid job id");
  }

  const job = await Job.findById(req.params.id)
    .populate("employer", "companyName logoUrl location website industry description")
    .populate("postedBy", "name email");

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  const canViewPrivateJob =
    req.user &&
    (req.user.role === "admin" || String(job.postedBy) === String(req.user._id));

  if (job.status === "draft" && !canViewPrivateJob) {
    throw new ApiError(404, "Job not found");
  }

  res.json({ job });
});

const createJob = asyncHandler(async (req, res) => {
  const employer = await Employer.findOne({ user: req.user._id });

  if (!employer && req.user.role !== "admin") {
    throw new ApiError(400, "Create a company profile before posting jobs");
  }

  const {
    title,
    description,
    requirements,
    responsibilities,
    location,
    jobType,
    salaryMin,
    salaryMax,
    currency,
    experienceLevel,
    remote,
    category,
    skills,
    deadline,
    status,
  } = req.body;

  if (!title || !description || !location) {
    throw new ApiError(400, "Title, description, and location are required");
  }

  const parseBoolean = (value) => value === true || value === "true";
  const nextStatus = JOB_STATUSES.includes(status) ? status : "draft";
  const employerId = req.user.role === "admin" ? req.body.employerId : employer._id;

  if (!employerId) {
    throw new ApiError(400, "employerId is required for admin job posting");
  }

  const job = await Job.create({
    title,
    description,
    requirements: parseList(requirements),
    responsibilities: parseList(responsibilities),
    location,
    jobType,
    salaryMin,
    salaryMax,
    currency,
    experienceLevel,
    remote: parseBoolean(remote),
    category,
    skills: parseList(skills),
    deadline,
    status: nextStatus,
    employer: employerId,
    postedBy: req.user._id,
  });

  await recordJobHistory({
    job: job._id,
    actor: req.user._id,
    action: "created",
    after: snapshotJob(job),
  }).catch((error) => {
    console.error("Failed to record job creation history:", error);
  });

  if (job.status === "open") {
    await notifyMatchingJobs({
      job,
      actorId: req.user._id,
    }).catch((error) => {
      console.error("Failed to send matching job notifications:", error);
    });
  }

  res.status(201).json({
    message: "Job posted successfully",
    job,
  });
});

const updateJob = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, "Invalid job id");
  }

  const job = await Job.findById(req.params.id);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  const isOwner = String(job.postedBy) === String(req.user._id);
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You are not allowed to edit this job");
  }

  const updates = req.body;
  if (updates.status !== undefined && !JOB_STATUSES.includes(updates.status)) {
    throw new ApiError(400, "Invalid job status");
  }

  const beforeSnapshot = snapshotJob(job);
  job.title = updates.title ?? job.title;
  job.description = updates.description ?? job.description;
  job.requirements = updates.requirements ? parseList(updates.requirements) : job.requirements;
  job.responsibilities = updates.responsibilities ? parseList(updates.responsibilities) : job.responsibilities;
  job.location = updates.location ?? job.location;
  job.jobType = updates.jobType ?? job.jobType;
  job.salaryMin = updates.salaryMin ?? job.salaryMin;
  job.salaryMax = updates.salaryMax ?? job.salaryMax;
  job.currency = updates.currency ?? job.currency;
  job.experienceLevel = updates.experienceLevel ?? job.experienceLevel;
  job.remote = updates.remote === undefined ? job.remote : updates.remote === true || updates.remote === "true";
  job.category = updates.category ?? job.category;
  job.skills = updates.skills ? parseList(updates.skills) : job.skills;
  job.status = updates.status ?? job.status;
  job.deadline = updates.deadline ?? job.deadline;

  const updatedJob = await job.save();

  const afterSnapshot = snapshotJob(updatedJob);
  const changedFields = Object.entries(afterSnapshot)
    .filter(([key, value]) => beforeSnapshot[key] !== value)
    .map(([field, after]) => ({
      field,
      before: beforeSnapshot[field],
      after,
    }));
  const historyAction = getJobHistoryAction(changedFields, "updated");

  await recordJobHistory({
    job: updatedJob._id,
    actor: req.user._id,
    action: historyAction,
    before: beforeSnapshot,
    after: afterSnapshot,
  }).catch((error) => {
    console.error("Failed to record job update history:", error);
  });

  if (changedFields.length > 0) {
    await notifySavedJobFollowers({
      job: updatedJob,
      changes: changedFields,
      actorId: req.user._id,
    }).catch((error) => {
      console.error("Failed to send saved job update notifications:", error);
    });
  }

  res.json({
    message: "Job updated successfully",
    job: updatedJob,
  });
});

const deleteJob = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, "Invalid job id");
  }

  const job = await Job.findById(req.params.id);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  const isOwner = String(job.postedBy) === String(req.user._id);
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You are not allowed to delete this job");
  }

  const beforeSnapshot = snapshotJob(job);
  await Application.deleteMany({ job: job._id });
  await recordJobHistory({
    job: job._id,
    actor: req.user._id,
    action: "deleted",
    before: beforeSnapshot,
  }).catch((error) => {
    console.error("Failed to record job deletion history:", error);
  });
  await notifySavedJobDeletion({
    job,
    actorId: req.user._id,
  }).catch((error) => {
    console.error("Failed to send saved job deletion notifications:", error);
  });
  await job.deleteOne();

  res.json({
    message: "Job deleted successfully",
  });
});

const getMyJobs = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { postedBy: req.user._id };

  const jobs = await Job.find(filter)
    .populate("employer", "companyName location website industry")
    .sort({ createdAt: -1 });

  res.json({ jobs });
});

export { listJobs, getJobById, createJob, updateJob, deleteJob, getMyJobs };
