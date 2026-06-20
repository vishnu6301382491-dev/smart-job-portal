import mongoose from "mongoose";
import Employer from "../models/Employer.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const upsertMyEmployerProfile = asyncHandler(async (req, res) => {
  const { companyName, website, industry, size, location, description, logoUrl, contactEmail, contactPhone } = req.body;

  if (!companyName) {
    throw new ApiError(400, "Company name is required");
  }

  const existingProfile = await Employer.findOne({ user: req.user._id });

  const payload = {
    companyName,
    website,
    industry,
    size,
    location,
    description,
    logoUrl,
    contactEmail,
    contactPhone,
    user: req.user._id,
  };

  const employer = existingProfile
    ? await Employer.findByIdAndUpdate(existingProfile._id, payload, { new: true, runValidators: true })
    : await Employer.create(payload);

  res.json({
    message: existingProfile ? "Company profile updated" : "Company profile created",
    employer,
  });
});

const getMyEmployerProfile = asyncHandler(async (req, res) => {
  const employer = await Employer.findOne({ user: req.user._id }).populate("user", "name email role");

  if (!employer) {
    throw new ApiError(404, "Company profile not found");
  }

  res.json({ employer });
});

const getEmployerDashboard = asyncHandler(async (req, res) => {
  const employer = await Employer.findOne({ user: req.user._id });

  if (!employer) {
    throw new ApiError(404, "Company profile not found");
  }

  const [jobsCount, openJobsCount, applicationsCount] = await Promise.all([
    Job.countDocuments({ employer: employer._id }),
    Job.countDocuments({ employer: employer._id, status: "open" }),
    Application.countDocuments({ employer: employer._id }),
  ]);

  const recentJobs = await Job.find({ employer: employer._id })
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    stats: {
      jobsCount,
      openJobsCount,
      applicationsCount,
    },
    recentJobs,
  });
});

const getEmployers = asyncHandler(async (req, res) => {
  const employers = await Employer.find()
    .populate("user", "name email role isActive")
    .sort({ createdAt: -1 });

  res.json({ employers });
});

const getEmployerById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, "Invalid employer id");
  }

  const employer = await Employer.findById(req.params.id).populate("user", "name email role");

  if (!employer) {
    throw new ApiError(404, "Employer not found");
  }

  res.json({ employer });
});

export {
  upsertMyEmployerProfile,
  getMyEmployerProfile,
  getEmployerDashboard,
  getEmployers,
  getEmployerById,
};

