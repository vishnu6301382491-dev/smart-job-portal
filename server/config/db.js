import mongoose from "mongoose";

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const getMongoUri = () => {
  const uri = process.env.MONGO_URI?.trim();

  if (!uri) {
    throw new Error("MONGO_URI is not defined");
  }

  return uri;
};

export const getMongoOptions = () => ({
  dbName: process.env.MONGO_DB_NAME?.trim() || undefined,
  autoIndex: process.env.NODE_ENV !== "production",
  maxPoolSize: parseNumber(process.env.MONGO_MAX_POOL_SIZE, 10),
  serverSelectionTimeoutMS: parseNumber(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 5000),
  socketTimeoutMS: parseNumber(process.env.MONGO_SOCKET_TIMEOUT_MS, 45000),
  retryWrites: true,
  w: "majority",
});

export const connectDB = async () => {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(getMongoUri(), getMongoOptions());
    console.log("MongoDB connected");
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

export const isMongoConnected = () => mongoose.connection.readyState === 1;

export default connectDB;
