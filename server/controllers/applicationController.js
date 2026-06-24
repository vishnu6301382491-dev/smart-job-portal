import mongoose from "mongoose";
import Job from "../models/Job.js";
import Employer from "../models/Employer.js";
import Application from "../models/Application.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { isExternalJobId } from "../utils/externalJobs.js";

const applyToJob = asyncHandler(async (req, res) => {
  if (isExternalJobId(req.params.jobId)) {
    throw new ApiError(400, "External job listings must be applied to on the source website");
  }

  if (!mongoose.isValidObjectId(req.params.jobId)) {
    throw new ApiError(400, "Invalid job id");
  }

  const job = await Job.findById(req.params.jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.status !== "open") {
    throw new ApiError(400, "This job is not open for applications");
  }

  const employer = await Employer.findById(job.employer);
  const resumeUrl = req.body.resumeUrl || req.user.resumeUrl || "";

  const existingApplication = await Application.findOne({
    job: job._id,
    applicant: req.user._id,
  });

  if (existingApplication) {
    throw new ApiError(409, "You already applied to this job");
  }

  const application = await Application.create({
    job: job._id,
    applicant: req.user._id,
    employer: employer?._id || job.employer,
    coverLetter: req.body.coverLetter,
    resumeUrl,
  });

  job.applicantsCount += 1;
  await job.save();

  res.status(201).json({
    message: "Application submitted successfully",
    application,
  });
});

const getMyApplications = asyncHandler(async (req, res) => {
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

const getJobApplicants = asyncHandler(async (req, res) => {
  if (isExternalJobId(req.params.jobId)) {
    throw new ApiError(400, "External job listings do not have local applicants");
  }

  if (!mongoose.isValidObjectId(req.params.jobId)) {
    throw new ApiError(400, "Invalid job id");
  }

  const job = await Job.findById(req.params.jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (req.user.role !== "admin" && String(job.postedBy) !== String(req.user._id)) {
    throw new ApiError(403, "You are not allowed to view these applicants");
  }

  const applications = await Application.find({ job: job._id })
    .populate("applicant", "name email phone title location skills resumeUrl resumeName")
    .sort({ createdAt: -1 });

  res.json({ job, applications });
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, "Invalid application id");
  }

  const application = await Application.findById(req.params.id).populate("job");

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  if (req.user.role !== "admin" && String(application.job.postedBy) !== String(req.user._id)) {
    throw new ApiError(403, "You are not allowed to update this application");
  }

  application.status = req.body.status || application.status;
  application.notes = req.body.notes ?? application.notes;

  const updatedApplication = await application.save();

  res.json({
    message: "Application updated successfully",
    application: updatedApplication,
  });
});

export { applyToJob, getMyApplications, getJobApplicants, updateApplicationStatus };
