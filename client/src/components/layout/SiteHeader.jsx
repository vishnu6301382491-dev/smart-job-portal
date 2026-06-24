import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import NotificationPreferenceControls from "../notifications/NotificationPreferenceControls";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { userService } from "../../services/userService";

const navLinkClass = ({ isActive }) =>
  [
    "rounded-lg px-3 py-2 text-sm transition",
    isActive
      ? "bg-[var(--surface-soft)] text-[var(--page-text)]"
      : "text-[var(--page-text-soft)] hover:bg-[var(--surface-soft)] hover:text-[var(--page-text)]",
  ].join(" ");

export const SiteHeader = () => {
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [preferenceSavingKey, setPreferenceSavingKey] = useState("");
  const notificationMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      if (!isAuthenticated) {
        if (!cancelled) {
          setUnreadNotifications(0);
        }
        return;
      }

      try {
        const { data } = await userService.notificationSummary();

        if (!cancelled) {
          setUnreadNotifications(data.unreadCount || 0);
        }
      } catch {
        if (!cancelled) {
          setUnreadNotifications(0);
        }
      }
    };

    const refresh = () => {
      void loadSummary();
    };

    refresh();
    window.addEventListener("smart-job-notifications-updated", refresh);
    const interval = window.setInterval(refresh, 60000);

    return () => {
      cancelled = true;
      window.removeEventListener("smart-job-notifications-updated", refresh);
      window.clearInterval(interval);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!notificationMenuOpen || !isAuthenticated) {
      return undefined;
    }

    let cancelled = false;

    const loadRecentNotifications = async () => {
      try {
        const { data } = await userService.notifications({ limit: 5 });

        if (!cancelled) {
          setRecentNotifications(data.notifications || []);
        }
      } catch {
        if (!cancelled) {
          setRecentNotifications([]);
        }
      }
    };

    const handlePointerDown = (event) => {
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setNotificationMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setNotificationMenuOpen(false);
      }
    };

    loadRecentNotifications();
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      cancelled = true;
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isAuthenticated, notificationMenuOpen]);

  const handlePreviewNotification = async (notification) => {
    if (!notification?.readAt) {
      try {
        await userService.markNotificationRead(notification._id);
        window.dispatchEvent(new Event("smart-job-notifications-updated"));
      } catch {
        // Keep the dropdown responsive even if the read update fails.
      }
    }

    setNotificationMenuOpen(false);
    navigate(notification.link || "/notifications");
  };

  const handleMarkAllRead = async () => {
    try {
      await userService.markAllNotificationsRead();
      window.dispatchEvent(new Event("smart-job-notifications-updated"));
      setNotificationMenuOpen(false);
    } catch {
      // Ignore dropdown action failures and let the inbox page surface errors.
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

    setPreferenceSavingKey(prefKey);

    try {
      const { data } = await userService.updateProfile({
        notificationPrefs: nextPrefs,
      });

      if (data.user) {
        updateUser(data.user);
      }
    } catch {
      // Keep the dropdown usable; the profile page can surface any error later.
    } finally {
      setPreferenceSavingKey("");
    }
  };

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-xl"
      style={{ backgroundColor: "var(--surface-strong)", borderColor: "var(--border-color)" }}
    >
      <div className="page-shell flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/20">
            SJ
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--page-text)]">Smart Job Portal</p>
            <p className="text-xs text-[var(--page-text-muted)]">Work with clarity</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/jobs" className={navLinkClass}>
            Jobs
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" className={navLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/saved-jobs" className={navLinkClass}>
                Saved Jobs
              </NavLink>
              <NavLink to="/profile" className={navLinkClass}>
                Profile
              </NavLink>
            </>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="secondary" type="button" onClick={toggleTheme}>
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
          {isAuthenticated ? (
            <div className="relative" ref={notificationMenuRef}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setNotificationMenuOpen((current) => !current)}
                className="relative"
              >
                Notifications
                {unreadNotifications > 0 ? (
                  <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
                    {unreadNotifications}
                  </span>
                ) : null}
              </Button>

              {notificationMenuOpen ? (
                <div className="absolute right-0 top-12 w-96 rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">Notification preferences</p>
                        <p className="text-xs text-slate-400">Quick glance at what is currently enabled.</p>
                      </div>
                      <Button as={Link} to="/profile" variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => setNotificationMenuOpen(false)}>
                        Edit
                      </Button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Digests</p>
                        <p className="mt-1 text-sm font-medium text-white">
                          {user?.notificationPrefs?.emailDigests ? user.notificationPrefs.digestFrequency || "Daily" : "Off"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Unread</p>
                        <p className="mt-1 text-sm font-medium text-white">{unreadNotifications}</p>
                      </div>
                    </div>
                  </div>

                  <NotificationPreferenceControls
                    user={user}
                    onTogglePreference={handleTogglePreference}
                    savingKey={preferenceSavingKey}
                    title="Notification preferences"
                    description="Quick glance at what is currently enabled."
                    className="mt-3 rounded-2xl p-4"
                  />

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Recent alerts</p>
                      <p className="text-xs text-slate-400">{unreadNotifications} unread</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleMarkAllRead()}
                      className="text-xs font-medium text-cyan-300 transition hover:text-cyan-200"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {recentNotifications.length > 0 ? (
                      recentNotifications.map((notification) => (
                        <button
                          key={notification._id}
                          type="button"
                          onClick={() => void handlePreviewNotification(notification)}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-cyan-400/30 hover:bg-white/8"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-white">{notification.title}</p>
                            {!notification.readAt ? (
                              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                            ) : null}
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{notification.message}</p>
                        </button>
                      ))
                    ) : (
                      <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                        No notifications yet.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <Button as={Link} to="/notifications" variant="secondary" className="flex-1" onClick={() => setNotificationMenuOpen(false)}>
                      Open inbox
                    </Button>
                    <Button as={Link} to="/profile" variant="ghost" className="flex-1" onClick={() => setNotificationMenuOpen(false)}>
                      Settings
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          {isAuthenticated ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-[var(--page-text)]">{user?.name}</p>
                <p className="text-xs capitalize text-[var(--page-text-muted)]">{user?.role}</p>
              </div>
              <Button variant="ghost" type="button" onClick={() => void logout()}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button as={Link} to="/login" variant="ghost">
                Login
              </Button>
              <Button as={Link} to="/register">
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
