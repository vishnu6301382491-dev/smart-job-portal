import mongoose from "mongoose";
import Job from "../models/Job.js";
import Employer from "../models/Employer.js";
import Application from "../models/Application.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
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

const buildJobQuery = (query) => {
  const filters = {};

  if (query.q) {
    filters.$or = [
      { title: { $regex: query.q, $options: "i" } },
      { description: { $regex: query.q, $options: "i" } },
      { category: { $regex: query.q, $options: "i" } },
      { skills: { $in: [new RegExp(query.q, "i")] } },
    ];
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
  const jobs = await Job.find(buildJobQuery(req.query))
    .populate("employer", "companyName logoUrl location website industry")
    .populate("postedBy", "name email")
    .sort({ createdAt: -1 });

  res.json({ jobs });
});

const getJobById = asyncHandler(async (req, res) => {
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
