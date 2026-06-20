import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../_PageShell";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Loader } from "../../components/ui/Loader";
import { adminService } from "../../services/adminService";
import { getErrorMessage } from "../../services/error";

const defaultStats = {
  users: 0,
  employers: 0,
  jobs: 0,
  applications: 0,
  openJobs: 0,
  closedJobs: 0,
};

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await adminService.stats();
        if (!cancelled) {
          setStats(data.stats || defaultStats);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Unable to load admin stats"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  const summaryCards = [
    { label: "Users", value: stats.users },
    { label: "Employers", value: stats.employers },
    { label: "Jobs", value: stats.jobs },
    { label: "Applications", value: stats.applications },
  ];

  return (
    <PageShell
      title="Admin dashboard"
      description="Monitor portal health, users, jobs, and employers with simple moderation controls."
      actions={[]}
    >
      {loading ? (
        <Loader label="Loading admin stats" />
      ) : error ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-200">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">System status</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Healthy and responsive</h3>
                </div>
                <Badge variant="success">Online</Badge>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Button as={Link} to="/admin/users">
                  Manage Users
                </Button>
                <Button as={Link} to="/admin/jobs" variant="secondary">
                  Review Jobs
                </Button>
                <Button as={Link} to="/admin/employers" variant="secondary">
                  Review Employers
                </Button>
                <Button variant="secondary">Export Reports</Button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Platform summary</p>
              <div className="mt-4 space-y-3">
                {[
                  `Open jobs: ${stats.openJobs}`,
                  `Closed jobs: ${stats.closedJobs}`,
                  "Admin moderation enabled",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-300"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default AdminDashboardPage;
