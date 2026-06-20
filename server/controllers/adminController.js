import mongoose from "mongoose";
import User from "../models/User.js";
import Employer from "../models/Employer.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import JobHistory from "../models/JobHistory.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const getDashboardStats = asyncHandler(async (req, res) => {
  const [users, employers, jobs, applications, openJobs, closedJobs, draftJobs] = await Promise.all([
    User.countDocuments(),
    Employer.countDocuments(),
    Job.countDocuments(),
    Application.countDocuments(),
    Job.countDocuments({ status: "open" }),
    Job.countDocuments({ status: "closed" }),
    Job.countDocuments({ status: "draft" }),
  ]);

  res.json({
    stats: {
      users,
      employers,
      jobs,
      applications,
      openJobs,
      closedJobs,
      draftJobs,
    },
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users });
});

const updateUserRole = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, "Invalid user id");
  }

  const { role } = req.body;

  if (!["jobseeker", "employer", "admin"].includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.json({
    message: "User role updated",
    user,
  });
});

const toggleUserStatus = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, "Invalid user id");
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isActive = !user.isActive;
  const updatedUser = await user.save();

  res.json({
    message: "User status updated",
    user: updatedUser,
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, "Invalid user id");
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const employer = await Employer.findOne({ user: user._id });

  if (employer) {
    await Application.deleteMany({ employer: employer._id });
    await Job.deleteMany({ employer: employer._id });
    await employer.deleteOne();
  }

  await Application.deleteMany({ applicant: user._id });
  await Job.deleteMany({ postedBy: user._id });
  await user.deleteOne();

  res.json({
    message: "User deleted successfully",
  });
});

const getJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find()
    .populate("employer", "companyName location website industry")
    .populate("postedBy", "name email role")
    .sort({ createdAt: -1 });

  res.json({ jobs });
});

const getJobHistory = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, "Invalid job id");
  }

  const history = await JobHistory.find({ job: req.params.id })
    .populate("actor", "name email role")
    .sort({ createdAt: -1 });

  res.json({ history });
});

const deleteJob = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, "Invalid job id");
  }

  const job = await Job.findById(req.params.id);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  await Application.deleteMany({ job: job._id });
  await job.deleteOne();

  res.json({
    message: "Job deleted successfully",
  });
});

const getEmployers = asyncHandler(async (req, res) => {
  const employers = await Employer.find()
    .populate("user", "name email role isActive")
    .sort({ createdAt: -1 });

  res.json({ employers });
});

const deleteEmployer = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, "Invalid employer id");
  }

  const employer = await Employer.findById(req.params.id);

  if (!employer) {
    throw new ApiError(404, "Employer not found");
  }

  await Application.deleteMany({ employer: employer._id });
  await Job.deleteMany({ employer: employer._id });
  await employer.deleteOne();

  res.json({
    message: "Employer deleted successfully",
  });
});

export {
  getDashboardStats,
  getUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getJobs,
  getJobHistory,
  deleteJob,
  getEmployers,
  deleteEmployer,
};
