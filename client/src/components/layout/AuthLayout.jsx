import { Outlet, Link } from "react-router-dom";

export const AuthLayout = () => {
  return (
    <div className="page-shell flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--surface)] p-8 shadow-glow">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Smart Job Portal</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-[var(--page-text)] sm:text-5xl">
            A focused hiring workspace for jobseekers, employers, and admins.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--page-text-soft)] sm:text-base">
            Track opportunities, manage applications, and keep hiring flows clean with a fast local-first stack.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950" to="/jobs">
              Browse Jobs
            </Link>
            <Link
              className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-medium text-[var(--page-text)]"
              to="/register"
            >
              Create Account
            </Link>
          </div>
        </section>

        <section className="glass-panel rounded-3xl p-6">
          <Outlet />
        </section>
      </div>
    </div>
  );
};
