import Notification from "../models/Notification.js";
import User from "../models/User.js";
import sendEmail from "./email.js";

const formatNotificationLines = (notifications = []) => {
  return notifications
    .slice(0, 10)
    .map((notification) => `- ${notification.title}: ${notification.message}`)
    .join("\n");
};

const buildDigestSubject = (count) => {
  const noun = count === 1 ? "update" : "updates";
  return `You have ${count} job ${noun} waiting`;
};

const buildDigestText = (user, notifications = []) => {
  const lines = formatNotificationLines(notifications);

  return [
    `Hi ${user.name || "there"},`,
    "",
    `Here is your Smart Job digest with ${notifications.length} new alerts.`,
    "",
    lines || "No unread alerts were available for this digest.",
    "",
    "Open your inbox at /notifications to review everything in the app.",
  ].join("\n");
};

const buildDigestHtml = (user, notifications = []) => {
  const items = notifications
    .slice(0, 10)
    .map(
      (notification) => `
        <li style="margin-bottom:12px">
          <strong>${notification.title}</strong><br />
          <span>${notification.message}</span>
        </li>
      `
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <h2 style="margin: 0 0 12px;">Hi ${user.name || "there"},</h2>
      <p style="margin: 0 0 16px;">Here is your Smart Job digest with ${notifications.length} new alerts.</p>
      <ul style="padding-left: 18px; margin: 0 0 16px;">${items || "<li>No unread alerts were available for this digest.</li>"}</ul>
      <p style="margin: 0;">Open your inbox in the app to review everything in one place.</p>
    </div>
  `;
};

const isDigestDue = (prefs = {}, lastDigestSentAt) => {
  if (!prefs.emailDigests) {
    return false;
  }

  const frequency = prefs.digestFrequency === "weekly" ? "weekly" : "daily";
  const intervalMs = frequency === "weekly" ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  if (!lastDigestSentAt) {
    return true;
  }

  return Date.now() - new Date(lastDigestSentAt).getTime() >= intervalMs;
};

const sendNotificationDigestForUser = async (user) => {
  if (!user?.email || !user.notificationPrefs?.emailDigests) {
    return { sent: false, reason: "digest_disabled" };
  }

  const notifications = await Notification.find({
    user: user._id,
    readAt: { $exists: false },
  })
    .sort({ createdAt: -1 })
    .limit(10);

  if (notifications.length === 0) {
    return { sent: false, reason: "no_notifications" };
  }

  const subject = buildDigestSubject(notifications.length);
  const text = buildDigestText(user, notifications);
  const html = buildDigestHtml(user, notifications);
  const delivery = await sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });

  user.notificationPrefs = {
    ...(user.notificationPrefs || {}),
    lastDigestSentAt: new Date(),
  };
  await user.save();

  return {
    sent: true,
    delivery,
    count: notifications.length,
    subject,
  };
};

const processNotificationDigests = async () => {
  const users = await User.find({
    isActive: true,
    "notificationPrefs.emailDigests": true,
  }).select("name email notificationPrefs");

  const results = [];

  for (const user of users) {
    if (!isDigestDue(user.notificationPrefs, user.notificationPrefs?.lastDigestSentAt)) {
      continue;
    }

    try {
      const result = await sendNotificationDigestForUser(user);
      results.push({
        userId: String(user._id),
        ...result,
      });
    } catch (error) {
      results.push({
        userId: String(user._id),
        sent: false,
        error: error.message,
      });
    }
  }

  return results;
};

const scheduleNotificationDigestJobs = () => {
  const intervalMs = 60 * 60 * 1000;
  const run = () => {
    void processNotificationDigests().catch((error) => {
      console.error("Notification digest sweep failed:", error);
    });
  };

  run();
  return setInterval(run, intervalMs);
};

export { buildDigestHtml, buildDigestText, processNotificationDigests, scheduleNotificationDigestJobs, sendNotificationDigestForUser };
