import JobHistory from "../models/JobHistory.js";

export const JOB_STATUSES = ["draft", "open", "closed"];

const normalizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeValue(item)]));
  }

  return value ?? null;
};

export const snapshotJob = (job) => {
  if (!job) {
    return null;
  }

  const doc = typeof job.toObject === "function" ? job.toObject({ virtuals: false }) : job;

  return {
    id: String(doc._id || ""),
    title: doc.title ?? "",
    description: doc.description ?? "",
    requirements: Array.isArray(doc.requirements) ? [...doc.requirements] : [],
    responsibilities: Array.isArray(doc.responsibilities) ? [...doc.responsibilities] : [],
    location: doc.location ?? "",
    jobType: doc.jobType ?? "",
    salaryMin: doc.salaryMin ?? null,
    salaryMax: doc.salaryMax ?? null,
    currency: doc.currency ?? "",
    experienceLevel: doc.experienceLevel ?? "",
    remote: Boolean(doc.remote),
    category: doc.category ?? "",
    skills: Array.isArray(doc.skills) ? [...doc.skills] : [],
    status: doc.status ?? "",
    deadline: doc.deadline ? new Date(doc.deadline).toISOString() : null,
    employer: String(doc.employer?._id || doc.employer || ""),
    postedBy: String(doc.postedBy?._id || doc.postedBy || ""),
    applicantsCount: Number(doc.applicantsCount || 0),
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
};

export const buildJobChanges = (before, after) => {
  const trackedFields = [
    "title",
    "description",
    "requirements",
    "responsibilities",
    "location",
    "jobType",
    "salaryMin",
    "salaryMax",
    "currency",
    "experienceLevel",
    "remote",
    "category",
    "skills",
    "status",
    "deadline",
  ];

  return trackedFields
    .map((field) => ({
      field,
      before: normalizeValue(before?.[field]),
      after: normalizeValue(after?.[field]),
    }))
    .filter((entry) => JSON.stringify(entry.before) !== JSON.stringify(entry.after));
};

export const getJobHistoryAction = (changes = [], fallback = "updated") => {
  if (changes.length === 1 && changes[0].field === "status") {
    return "status_changed";
  }

  return fallback;
};

export const buildJobHistorySummary = (action, changes = []) => {
  if (action === "created") {
    return "Created job posting";
  }

  if (action === "deleted") {
    return "Deleted job posting";
  }

  if (action === "status_changed" && changes[0]) {
    return `Changed ${changes[0].field} from ${String(changes[0].before)} to ${String(changes[0].after)}`;
  }

  if (changes.length === 0) {
    return "Updated job posting";
  }

  const fields = changes.map((change) => change.field.replace(/([A-Z])/g, " $1").toLowerCase());
  return `Updated ${fields.join(", ")}`;
};

export const recordJobHistory = async ({ job, actor, action, before = null, after = null }) => {
  const changes = action === "created" || action === "deleted" ? [] : buildJobChanges(before, after);

  if (action !== "created" && action !== "deleted" && changes.length === 0) {
    return null;
  }

  return JobHistory.create({
    job,
    actor,
    action,
    summary: buildJobHistorySummary(action, changes),
    changes,
    before,
    after,
  });
};
