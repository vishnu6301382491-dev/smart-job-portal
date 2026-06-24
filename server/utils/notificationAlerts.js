import Notification from "../models/Notification.js";
import User from "../models/User.js";

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const extractUserSkills = (user) => (Array.isArray(user?.skills) ? user.skills.map((skill) => String(skill).trim()).filter(Boolean) : []);

const buildSavedJobUpdateMessage = (job, changes = []) => {
  const changedFields = changes.map((entry) => entry.field);

  if (changedFields.includes("status")) {
    return job.status === "closed"
      ? `Your saved role at ${job.employer?.companyName || "this company"} has been closed.`
      : `Your saved role at ${job.employer?.companyName || "this company"} is now ${job.status}.`;
  }

  if (changedFields.includes("salaryMin") || changedFields.includes("salaryMax") || changedFields.includes("currency")) {
    return `The compensation details for ${job.title} were updated.`;
  }

  if (changedFields.includes("location")) {
    return `The location for ${job.title} was updated.`;
  }

  if (changedFields.includes("skills")) {
    return `The skill requirements for ${job.title} were updated.`;
  }

  return `${job.title} was updated.`;
};

const buildSavedJobUpdateTitle = (job, changes = []) => {
  const changedFields = changes.map((entry) => entry.field);

  if (changedFields.includes("status") && job.status === "closed") {
    return "Saved job closed";
  }

  if (changedFields.includes("status")) {
    return "Saved job status changed";
  }

  return "Saved job updated";
};

const notifySavedJobFollowers = async ({ job, changes = [], actorId = null }) => {
  if (!job?._id) {
    return [];
  }

  const recipients = await User.find({
    _id: { $ne: actorId },
    isActive: true,
    savedJobs: String(job._id),
    "notificationPrefs.savedJobUpdates": { $ne: false },
  }).select("_id");

  if (recipients.length === 0) {
    return [];
  }

  const title = buildSavedJobUpdateTitle(job, changes);
  const message = buildSavedJobUpdateMessage(job, changes);
  const docs = recipients.map((recipient) => ({
    user: recipient._id,
    kind: "saved_job_updated",
    title,
    message,
    link: `/jobs/${job._id}`,
    jobId: String(job._id),
    jobTitle: job.title,
    meta: {
      employer: job.employer?.companyName || "",
      changes: changes.map((entry) => entry.field),
    },
  }));

  return Notification.insertMany(docs);
};

const notifySavedJobDeletion = async ({ job, actorId = null }) => {
  if (!job?._id) {
    return [];
  }

  const recipients = await User.find({
    _id: { $ne: actorId },
    isActive: true,
    savedJobs: String(job._id),
    "notificationPrefs.savedJobUpdates": { $ne: false },
  }).select("_id");

  if (recipients.length === 0) {
    return [];
  }

  return Notification.insertMany(
    recipients.map((recipient) => ({
      user: recipient._id,
      kind: "saved_job_deleted",
      title: "Saved job removed",
      message: `${job.title} is no longer available. We saved this alert so you can revisit the role history.`,
      link: "/jobs",
      jobId: String(job._id),
      jobTitle: job.title,
      meta: {
        employer: job.employer?.companyName || "",
      },
    }))
  );
};

const notifyMatchingJobs = async ({ job, actorId = null }) => {
  if (!job?._id || !Array.isArray(job.skills) || job.skills.length === 0) {
    return [];
  }

  const skillRegexes = job.skills
    .map((skill) => String(skill).trim())
    .filter(Boolean)
    .map((skill) => new RegExp(`^${escapeRegex(skill)}$`, "i"));

  if (skillRegexes.length === 0) {
    return [];
  }

  const recipients = await User.find({
    _id: { $ne: actorId },
    role: "jobseeker",
    isActive: true,
    skills: { $in: skillRegexes },
    "notificationPrefs.matchedJobs": { $ne: false },
  }).select("_id skills");

  if (recipients.length === 0) {
    return [];
  }

  const jobSkills = job.skills.map((skill) => String(skill).trim()).filter(Boolean);
  const docs = recipients.map((recipient) => {
    const recipientSkills = extractUserSkills(recipient);
    const matchedSkills = jobSkills.filter((skill) =>
      recipientSkills.some((candidate) => normalizeText(candidate) === normalizeText(skill))
    );

    return {
      user: recipient._id,
      kind: "matched_job",
      title: "New job matches your skills",
      message: `${job.title} at ${job.employer?.companyName || "a company"} matches ${matchedSkills.slice(0, 3).join(", ") || "your profile"}.`,
      link: `/jobs/${job._id}`,
      jobId: String(job._id),
      jobTitle: job.title,
      meta: {
        employer: job.employer?.companyName || "",
        skills: matchedSkills,
      },
    };
  });

  return Notification.insertMany(docs);
};

export { notifyMatchingJobs, notifySavedJobDeletion, notifySavedJobFollowers };
