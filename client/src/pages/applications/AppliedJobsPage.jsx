import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../_PageShell";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Loader } from "../../components/ui/Loader";
import { userService } from "../../services/userService";
import { getErrorMessage } from "../../services/error";

const statusVariant = (status) => {
  if (status === "hired" || status === "shortlisted" || status === "reviewed") {
    return "success";
  }

  if (status === "rejected") {
    return "danger";
  }

  return "warning";
};

const AppliedJobsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadApplications = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await userService.appliedJobs();

        if (!cancelled) {
          setApplications(data.applications || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Unable to load your applications"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadApplications();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell
      title="Applied jobs"
      description="Review the jobs you’ve already applied to and track status updates from employers."
      actions={[]}
    >
      {loading ? (
        <Loader label="Loading applications" />
      ) : error ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-200">
          {error}
        </div>
      ) : applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((application) => (
            <article
              key={application._id}
              className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h3 className="text-lg font-semibold text-white">{application.job?.title || "Deleted job"}</h3>
                <p className="mt-1 text-sm text-slate-400">{application.job?.employer?.companyName || "Employer unavailable"}</p>
                <p className="mt-2 text-sm text-slate-500">
                  Applied {new Date(application.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={statusVariant(application.status)}>{application.status}</Badge>
                <Button as={Link} to={application.job?._id ? `/jobs/${application.job._id}` : "/jobs"} variant="secondary">
                  View Job
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          You have not applied to any jobs yet.
        </div>
      )}
    </PageShell>
  );
};

export default AppliedJobsPage;
