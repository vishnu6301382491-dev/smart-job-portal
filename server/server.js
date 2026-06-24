import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import adminRoutes from "./routes/adminRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import employerRoutes from "./routes/employerRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import seedAdminUser from "./utils/seedAdmin.js";
import { scheduleNotificationDigestJobs } from "./utils/notificationDigest.js";
import { isMongoConnected } from "./config/db.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultClientOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://vishnu6301382491-dev.github.io",
];
const expandOrigin = (origin) => {
  const variants = new Set([origin]);

  try {
    const url = new URL(origin);
    const port = url.port ? `:${url.port}` : "";

    if (url.hostname === "localhost") {
      variants.add(`${url.protocol}//127.0.0.1${port}`);
      variants.add(`${url.protocol}//[::1]${port}`);
    }

    if (url.hostname === "127.0.0.1" || url.hostname === "[::1]") {
      variants.add(`${url.protocol}//localhost${port}`);
    }
  } catch {
    // Ignore invalid URLs and keep the original value.
  }

  return [...variants];
};

const allowedOrigins = [...new Set(
  (process.env.CLIENT_URL || defaultClientOrigins.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .flatMap(expandOrigin)
)];
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

const apiRouter = express.Router();

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

apiRouter.get("/", (req, res) => {
  res.json({
    message: "Smart Job Portal API",
    health: "/api/health",
      endpoints: {
        auth: "/api/auth",
        users: "/api/users",
        jobs: "/api/jobs",
        applications: "/api/applications",
        employers: "/api/employers",
        admin: "/api/admin",
        notifications: "/api/users/notifications",
      },
    });
  });

apiRouter.get("/health", (req, res) => {
  res.json({
    message: "Smart Job Portal API is running",
    database: isMongoConnected() ? "connected" : "disconnected",
  });
});

app.use("/api", apiRouter);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/employers", employerRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await seedAdminUser();
  scheduleNotificationDigestJobs();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
