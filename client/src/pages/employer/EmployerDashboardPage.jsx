import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../_PageShell";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Card } from "../../components/ui/Card";
import { Loader } from "../../components/ui/Loader";
import { employerService } from "../../services/employerService";
import { jobService } from "../../services/jobService";
import { getErrorMessage } from "../../services/error";
import { getJobStatusMeta } from "../../utils/jobStatus";

const EmployerDashboardPage = () => {
  const [dashboard, setDashboard] = useState({ stats: { jobsCount: 0, openJobsCount: 0, applicationsCount: 0 }, recentJobs: [] });
  const [jobs, setJobs] = useState([]);
  const [jobStatusDrafts, setJobStatusDrafts] = useState({});
  const [updatingJobId, setUpdatingJobId] = useState("");
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    companyName: "",
    website: "",
    industry: "",
    size: "",
    location: "",
    description: "",
    logoUrl: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const [dashboardResponse, profileResponse, jobsResponse] = await Promise.allSettled([
          employerService.dashboard(),
          employerService.getProfile(),
          jobService.myJobs(),
        ]);

        if (cancelled) {
          return;
        }

        if (dashboardResponse.status === "fulfilled") {
          setDashboard(dashboardResponse.value.data);
        }

        if (profileResponse.status === "fulfilled") {
          const employer = profileResponse.value.data.employer;
          setProfile(employer);
          setForm({
            companyName: employer.companyName || "",
            website: employer.website || "",
            industry: employer.industry || "",
            size: employer.size || "",
            location: employer.location || "",
            description: employer.description || "",
            logoUrl: employer.logoUrl || "",
            contactEmail: employer.contactEmail || "",
            contactPhone: employer.contactPhone || "",
          });
        }

        if (jobsResponse.status === "fulfilled") {
          const nextJobs = jobsResponse.value.data.jobs || [];
          setJobs(nextJobs);
          setJobStatusDrafts(
            Object.fromEntries(nextJobs.map((job) => [job._id, job.status || "draft"]))
          );
        }

        if (dashboardResponse.status === "rejected" && profileResponse.status === "rejected" && jobsResponse.status === "rejected") {
          setError(
            getErrorMessage(dashboardResponse.reason || profileResponse.reason || jobsResponse.reason, "Unable to load employer dashboard")
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Unable to load employer dashboard"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const { data } = await employerService.upsertProfile(form);
      setProfile(data.employer);
      setMessage(data.message || "Company profile saved");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save company profile"));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (jobId) => {
    const nextStatus = jobStatusDrafts[jobId];

    if (!nextStatus) {
      return;
    }

    setUpdatingJobId(jobId);
    setError("");
    setMessage("");

    try {
      await jobService.update(jobId, { status: nextStatus });
      const { data } = await jobService.myJobs();
      const nextJobs = data.jobs || [];
      setJobs(nextJobs);
      setJobStatusDrafts(
        Object.fromEntries(nextJobs.map((job) => [job._id, job.status || "draft"]))
      );
      setMessage("Job status updated");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update job status"));
    } finally {
      setUpdatingJobId("");
    }
  };

  const stats = [
    { label: "Open jobs", value: dashboard.stats?.openJobsCount || 0 },
    { label: "Total jobs", value: dashboard.stats?.jobsCount || 0 },
    { label: "Applications", value: dashboard.stats?.applicationsCount || 0 },
  ];

  return (
    <PageShell
      title="Employer dashboard"
      description="Manage your company profile, post jobs, and review applicants from one dashboard."
      actions={[]}
    >
      {loading ? (
        <Loader label="Loading employer dashboard" />
      ) : error ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-200">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Company profile</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    {profile?.companyName || "Create your company profile"}
                  </h3>
                </div>
                <Badge variant={profile ? "success" : "warning"}>{profile ? "Active" : "Not set"}</Badge>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {message ? (
                  <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                    {message}
                  </div>
                ) : null}
                <Input
                  label="Company Name"
                  value={form.companyName}
                  onChange={(event) => setForm({ ...form, companyName: event.target.value })}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Website"
                    value={form.website}
                    onChange={(event) => setForm({ ...form, website: event.target.value })}
                  />
                  <Input
                    label="Industry"
                    value={form.industry}
                    onChange={(event) => setForm({ ...form, industry: event.target.value })}
                  />
                  <Input
                    label="Company Size"
                    value={form.size}
                    onChange={(event) => setForm({ ...form, size: event.target.value })}
                  />
                  <Input
                    label="Location"
                    value={form.location}
                    onChange={(event) => setForm({ ...form, location: event.target.value })}
                  />
                </div>
                <Textarea
                  label="Description"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Logo URL"
                    value={form.logoUrl}
                    onChange={(event) => setForm({ ...form, logoUrl: event.target.value })}
                  />
                  <Input
                    label="Contact Email"
                    value={form.contactEmail}
                    onChange={(event) => setForm({ ...form, contactEmail: event.target.value })}
                  />
                  <Input
                    className="md:col-span-2"
                    label="Contact Phone"
                    value={form.contactPhone}
                    onChange={(event) => setForm({ ...form, contactPhone: event.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Button as={Link} to="/employer/jobs/new" type="button">
                    Post Job
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : profile ? "Update Profile" : "Create Profile"}
                  </Button>
                </div>
              </form>
            </Card>

            <Card className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Recent jobs</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Latest openings</h3>
                </div>
                <Badge variant="info">{jobs.length} jobs</Badge>
              </div>
              <div className="space-y-3">
                {jobs.slice(0, 5).map((job) => (
                  <div
                    key={job._id}
                    className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-white">{job.title}</p>
                          <Badge variant={getJobStatusMeta(job.status).variant}>{getJobStatusMeta(job.status).label}</Badge>
                        </div>
                        <p className="text-xs text-slate-400">{job.location}</p>
                      </div>
                      <Button as={Link} to={`/employer/jobs/${job._id}/edit`} variant="secondary">
                        Edit
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                      <Select
                        label="Quick status"
                        value={jobStatusDrafts[job._id] || job.status || "draft"}
                        onChange={(event) =>
                          setJobStatusDrafts({ ...jobStatusDrafts, [job._id]: event.target.value })
                        }
                      >
                        <option value="draft">Draft</option>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                      </Select>
                      <Button
                        type="button"
                        variant="secondary"
                        className="md:self-end"
                        onClick={() => handleStatusUpdate(job._id)}
                        disabled={updatingJobId === job._id}
                      >
                        {updatingJobId === job._id ? "Updating..." : "Update Status"}
                      </Button>
                    </div>
                  </div>
                ))}
                {jobs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                    No jobs posted yet.
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <p className="text-sm text-slate-400">Applicants tracked through the backend</p>
                <p className="mt-1 text-lg font-semibold text-white">{dashboard.stats?.applicationsCount || 0}</p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default EmployerDashboardPage;
