import User from "../models/User.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

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

const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const { name, phone, title, location, bio, avatar, skills } = req.body;

  user.name = name ?? user.name;
  user.phone = phone ?? user.phone;
  user.title = title ?? user.title;
  user.location = location ?? user.location;
  user.bio = bio ?? user.bio;
  user.avatar = avatar ?? user.avatar;
  user.skills = skills ? parseSkills(skills) : user.skills;

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

export { getMe, updateProfile, uploadResume, getAppliedJobs, getPublicProfile };

