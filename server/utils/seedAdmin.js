import User from "../models/User.js";

const shouldSeedAdmin = () =>
  Boolean(process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD);

const seedAdminUser = async () => {
  if (!shouldSeedAdmin()) {
    return null;
  }

  const email = process.env.SEED_ADMIN_EMAIL.trim().toLowerCase();
  const existingAdmin = await User.findOne({ email });

  if (existingAdmin) {
    return existingAdmin;
  }

  const admin = await User.create({
    name: process.env.SEED_ADMIN_NAME?.trim() || "Admin User",
    email,
    password: process.env.SEED_ADMIN_PASSWORD,
    role: "admin",
    title: process.env.SEED_ADMIN_TITLE?.trim() || "System Administrator",
    bio: process.env.SEED_ADMIN_BIO?.trim() || "Seeded administrator account for local development.",
    isActive: true,
  });

  console.log(`Seeded admin user: ${admin.email}`);
  return admin;
};

export default seedAdminUser;
