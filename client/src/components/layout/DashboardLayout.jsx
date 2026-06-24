import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const linkClass = ({ isActive }) =>
  [
    "block rounded-xl px-4 py-3 text-sm transition",
    isActive
      ? "bg-cyan-400/15 text-cyan-700 dark:text-cyan-200"
      : "text-[var(--page-text-soft)] hover:bg-[var(--surface-soft)] hover:text-[var(--page-text)]",
  ].join(" ");

export const DashboardLayout = () => {
  const { user } = useAuth();

  const links = [
    { to: "/dashboard", label: "Overview" },
    { to: "/profile", label: "Profile" },
    { to: "/applications", label: "Applied Jobs" },
    { to: "/notifications", label: "Notifications" },
    { to: "/saved-jobs", label: "Saved Jobs" },
  ];

  if (user?.role === "employer" || user?.role === "admin") {
    links.push({ to: "/employer", label: "Employer" });
    links.push({ to: "/employer/jobs/new", label: "Post Job" });
  }

  if (user?.role === "admin") {
    links.push({ to: "/admin", label: "Admin" });
  }

  return (
    <div className="page-shell grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="glass-panel rounded-3xl p-4">
        <div className="border-b border-[var(--border-color)] px-2 pb-4">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--page-text-muted)]">Signed in as</p>
          <p className="mt-2 text-lg font-semibold text-[var(--page-text)]">{user?.name || "Guest"}</p>
          <p className="text-sm capitalize text-[var(--page-text-muted)]">{user?.role || "user"}</p>
        </div>
        <nav className="mt-4 space-y-2">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass} end={link.to === "/dashboard"}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <section className="glass-panel rounded-3xl p-6">
        <Outlet />
      </section>
    </div>
  );
};
