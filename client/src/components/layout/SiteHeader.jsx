import { Link, NavLink } from "react-router-dom";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const navLinkClass = ({ isActive }) =>
  [
    "rounded-lg px-3 py-2 text-sm transition",
    isActive
      ? "bg-[var(--surface-soft)] text-[var(--page-text)]"
      : "text-[var(--page-text-soft)] hover:bg-[var(--surface-soft)] hover:text-[var(--page-text)]",
  ].join(" ");

export const SiteHeader = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

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
