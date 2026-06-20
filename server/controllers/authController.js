import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";

const sanitizeAuthUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  title: user.title,
  location: user.location,
  skills: user.skills,
  bio: user.bio,
  avatar: user.avatar,
  resumeUrl: user.resumeUrl,
  resumeName: user.resumeName,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, title, bio } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  const normalizedRole = role === "employer" ? "employer" : "jobseeker";
  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    role: normalizedRole,
    title,
    bio,
  });

  res.status(201).json({
    message: "Registration successful",
    token: generateToken(user._id),
    user: sanitizeAuthUser(user),
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  res.json({
    message: "Login successful",
    token: generateToken(user._id),
    user: sanitizeAuthUser(user),
  });
});

const logoutUser = asyncHandler(async (req, res) => {
  res.json({
    message: "Logout successful",
  });
});

export { registerUser, loginUser, logoutUser };
