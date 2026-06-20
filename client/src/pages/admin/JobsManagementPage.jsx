import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../_PageShell";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Loader } from "../../components/ui/Loader";
import { adminService } from "../../services/adminService";
import { getErrorMessage } from "../../services/error";

const JobsManagementPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadJobs = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await adminService.jobs();
      setJobs(data.jobs || []);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load jobs"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleDelete = async (jobId) => {
    const confirmed = window.confirm("Delete this job? This cannot be undone.");
    if (!confirmed) {
      return;
    }

    try {
      await adminService.deleteJob(jobId);
      await loadJobs();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to delete job"));
    }
  };

  return (
    <PageShell
      title="Manage jobs"
      description="Review all job postings and remove or update listings as needed."
      actions={[]}
    >
      {loading ? (
        <Loader label="Loading jobs" />
      ) : error ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-200">
          {error}
        </div>
      ) : jobs.length > 0 ? (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{job.employer?.companyName || "Employer unavailable"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={job.status === "open" ? "success" : "warning"}>{job.status}</Badge>
                <Button as={Link} to={`/jobs/${job._id}`} variant="secondary">
                  View
                </Button>
                <Button variant="danger" type="button" onClick={() => handleDelete(job._id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          No jobs found.
        </div>
      )}
    </PageShell>
  );
};

export default JobsManagementPage;
