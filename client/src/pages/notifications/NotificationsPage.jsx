import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../_PageShell";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Loader } from "../../components/ui/Loader";
import NotificationPreferenceControls from "../../components/notifications/NotificationPreferenceControls";
import { userService } from "../../services/userService";
import { getErrorMessage } from "../../services/error";
import { useAuth } from "../../context/AuthContext";

const kindMeta = {
  saved_job_updated: {
    label: "Saved job update",
    variant: "info",
  },
  saved_job_deleted: {
    label: "Saved job removed",
    variant: "warning",
  },
  matched_job: {
    label: "New match",
    variant: "success",
  },
};

const NotificationsPage = () => {
  const { user, updateUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("all");
  const [actionId, setActionId] = useState("");
  const [digestAction, setDigestAction] = useState(false);
  const [preferenceActionKey, setPreferenceActionKey] = useState("");
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    setLoading(true);
    setError("");

    try {
      const params = activeView === "unread" ? { unread: "true", limit: 50 } : { limit: 50 };
      const { data } = await userService.notifications(params);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load notifications"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  const visibleNotifications = useMemo(
    () => (activeView === "unread" ? notifications.filter((notification) => !notification.readAt) : notifications),
    [activeView, notifications]
  );

  const handleMarkAllRead = async () => {
    setActionId("all");

    try {
      await userService.markAllNotificationsRead();
      await loadNotifications();
      window.dispatchEvent(new Event("smart-job-notifications-updated"));
    } catch (err) {
      setError(getErrorMessage(err, "Unable to mark notifications as read"));
    } finally {
      setActionId("");
    }
  };

  const handleSendDigest = async () => {
    setDigestAction(true);
    setError("");

    try {
      await userService.sendNotificationDigest();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to send your digest email"));
    } finally {
      setDigestAction(false);
    }
  };

  const handleTogglePreference = async (prefKey) => {
    if (!user) {
      return;
    }

    const currentPrefs = user.notificationPrefs || {};
    const nextValue = currentPrefs[prefKey] === false;
    const nextPrefs = {
      ...currentPrefs,
      [prefKey]: nextValue,
    };

    setPreferenceActionKey(prefKey);
    setError("");

    try {
      const { data } = await userService.updateProfile({
        notificationPrefs: nextPrefs,
      });

      if (data.user) {
        updateUser(data.user);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update notification preferences"));
    } finally {
      setPreferenceActionKey("");
    }
  };

  const handleToggleRead = async (notification) => {
    setActionId(notification._id);

    try {
      if (notification.readAt) {
        await userService.deleteNotification(notification._id);
      } else {
        await userService.markNotificationRead(notification._id);
      }

      await loadNotifications();
      window.dispatchEvent(new Event("smart-job-notifications-updated"));
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update this notification"));
    } finally {
      setActionId("");
    }
  };

  return (
    <PageShell
      title="Notifications"
      description="Track saved job updates, new matching roles, and changes to listings you care about."
      actions={[
        { label: "Mark all read", variant: "secondary", onClick: handleMarkAllRead },
        { label: "Back to Jobs", href: "/jobs", variant: "ghost" },
      ]}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-5">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Alert inbox</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Stay on top of the roles you care about</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={activeView === "all" ? "primary" : "secondary"} onClick={() => setActiveView("all")}>
            All
          </Button>
          <Button
            type="button"
            variant={activeView === "unread" ? "primary" : "secondary"}
            onClick={() => setActiveView("unread")}
          >
            Unread
          </Button>
          <Badge variant="info">{unreadCount} unread</Badge>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Email digest</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Bundle unread alerts into one email</h3>
            <p className="mt-2 text-sm text-slate-400">
              {user?.notificationPrefs?.emailDigests
                ? `Your digest is set to ${user.notificationPrefs.digestFrequency || "daily"}.`
                : "Turn on email digests in your profile to get a compact summary in your inbox."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={user?.notificationPrefs?.emailDigests ? "success" : "warning"}>
              {user?.notificationPrefs?.emailDigests ? "Enabled" : "Disabled"}
            </Badge>
            <Button
              type="button"
              variant="secondary"
              disabled={!user?.notificationPrefs?.emailDigests || digestAction}
              onClick={() => void handleSendDigest()}
            >
              {digestAction ? "Sending..." : "Send digest now"}
            </Button>
            <Button as={Link} to="/profile" variant="ghost">
              Update preferences
            </Button>
          </div>
        </div>
      </div>

      <NotificationPreferenceControls
        user={user}
        onTogglePreference={handleTogglePreference}
        savingKey={preferenceActionKey}
        title="Quick controls"
        description="Saved-job alerts and matching-job alerts can be managed from here or the header dropdown."
        className="mt-5"
      />

      <div className="mt-5">
        {loading ? (
          <Loader label="Loading notifications" />
        ) : error ? (
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-200">
            {error}
          </div>
        ) : visibleNotifications.length > 0 ? (
          <div className="space-y-4">
            {visibleNotifications.map((notification) => {
              const meta = kindMeta[notification.kind] || kindMeta.saved_job_updated;

              return (
                <article
                  key={notification._id}
                  className={`rounded-3xl border p-5 transition ${
                    notification.readAt
                      ? "border-white/10 bg-white/5"
                      : "border-cyan-400/20 bg-cyan-400/10"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                        {!notification.readAt ? <Badge variant="warning">Unread</Badge> : null}
                      </div>
                      <h3 className="text-lg font-semibold text-white">{notification.title}</h3>
                      <p className="max-w-3xl text-sm leading-6 text-slate-300">{notification.message}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(notification.createdAt).toLocaleString()}
                        {notification.jobTitle ? ` • ${notification.jobTitle}` : null}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {notification.link ? (
                        <Button as={Link} to={notification.link} variant="secondary">
                          View role
                        </Button>
                      ) : null}
                      <Button type="button" variant="secondary" onClick={() => void handleToggleRead(notification)} disabled={actionId === notification._id}>
                        {actionId === notification._id
                          ? notification.readAt
                            ? "Removing..."
                            : "Saving..."
                          : notification.readAt
                          ? "Dismiss"
                          : "Mark read"}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-300">
            No notifications yet. When a saved job changes or a new match appears, it will show up here.
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default NotificationsPage;
