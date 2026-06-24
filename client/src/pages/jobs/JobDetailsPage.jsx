import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import PageShell from "../_PageShell";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Loader } from "../../components/ui/Loader";
import { jobService } from "../../services/jobService";
import { userService } from "../../services/userService";
import { getErrorMessage } from "../../services/error";
import { useAuth } from "../../context/AuthContext";

const formatSalary = (job) => {
  if (!job?.salaryMin && !job?.salaryMax) {
    return "Salary not specified";
  }

  const currency = job.currency || "USD";

  if (job.salaryMin && job.salaryMax) {
    return `${currency} ${job.salaryMin} - ${currency} ${job.salaryMax}`;
  }

  return `${currency} ${job.salaryMin || job.salaryMax}`;
};

const JobDetailsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, updateUser } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [bookmarking, setBookmarking] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [form, setForm] = useState({ coverLetter: "" });
  const isExternalJob = Boolean(job?.external);
  const isSaved = Boolean(job && Array.isArray(user?.savedJobs) && user.savedJobs.includes(job._id));
  const canEditJob =
    job && isAuthenticated && (user?.role === "admin" || String(job.postedBy?._id || job.postedBy) === String(user?._id));

  useEffect(() => {
    let cancelled = false;

    const loadJob = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await jobService.getById(id);

        if (!cancelled) {
          setJob(data.job);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Unable to load this job"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadJob();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleApply = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }

    setApplying(true);
    setApplicationMessage("");

    try {
      await jobService.apply(id, {
        coverLetter: form.coverLetter,
      });

      setApplicationMessage("Application submitted successfully.");
      setForm({ coverLetter: "" });
    } catch (err) {
      setApplicationMessage(getErrorMessage(err, "Unable to submit application"));
    } finally {
      setApplying(false);
    }
  };

  const handleToggleSavedJob = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }

    setBookmarking(true);
    setSavedMessage("");

    try {
      const { data } = isSaved ? await userService.removeSavedJob(id) : await userService.saveJob(id);

      if (data.user) {
        updateUser(data.user);
      }

      setSavedMessage(isSaved ? "Removed from saved jobs." : "Saved for later.");
    } catch (err) {
      setSavedMessage(getErrorMessage(err, "Unable to update saved jobs"));
    } finally {
      setBookmarking(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell py-12">
        <Loader label="Loading job details" />
      </div>
    );
  }

  const actions = [];

  if (job && canEditJob) {
    actions.push({ label: "Edit Job", href: `/employer/jobs/${id}/edit`, variant: "secondary" });
  }

  if (job) {
    actions.push({
      label: bookmarking ? "Saving..." : isSaved ? "Unsave Job" : "Save Job",
      variant: "secondary",
      onClick: handleToggleSavedJob,
    });
  }

  if (job && isExternalJob && job.sourceUrl) {
    actions.push({ label: "Open Original Listing", href: job.sourceUrl, variant: "secondary" });
  } else if (job && (!isAuthenticated || ["jobseeker", "admin"].includes(user?.role))) {
    actions.push({ label: "Apply Now", href: "#apply" });
  }

  return (
    <PageShell
      title="Job details"
      description={
        job
          ? `Inspect the full job post, application requirements, and employer information for ${job.title}.`
          : `Inspect the full job post for job ID ${id}.`
      }
      actions={actions}
    >
      {error ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {!job ? null : (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-center gap-2">
                {isExternalJob ? <Badge variant="warning">{job.sourceName || "External source"}</Badge> : null}
                <Badge variant="info">{job.jobType}</Badge>
                <Badge variant="neutral">{job.location}</Badge>
                <Badge variant="success">{formatSalary(job)}</Badge>
              </div>
              <h2 className="mt-4 text-3xl font-semibold text-white">{job.title}</h2>
              <p className="mt-2 text-sm text-slate-400">{job.employer?.companyName || "Independent employer"}</p>
              <p className="mt-5 text-sm leading-6 text-slate-300 sm:text-base">{job.description}</p>
              {isExternalJob && job.sourceUrl ? (
                <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  This listing is synced from an external source. Use the original listing to apply.
                </div>
              ) : null}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold text-white">Responsibilities</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                  {(job.responsibilities || []).map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-cyan-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold text-white">Requirements</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                  {(job.requirements || []).map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-cyan-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm font-semibold text-white">Skills</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(job.skills || []).map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>
            </div>

            {savedMessage ? (
              <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
                {savedMessage}
              </div>
            ) : null}

            <div id="apply" className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm font-semibold text-white">Apply now</p>
              <p className="mt-2 text-sm text-slate-400">
                {isExternalJob
                  ? "This listing comes from an external source, so apply on the original website."
                  : isAuthenticated
                  ? "Submit a short cover letter and apply directly from this page."
                  : "Sign in first to submit your application."}
              </p>

              {canEditJob ? (
                <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                  You posted this job, so you can update or close it anytime.
                </div>
              ) : null}

              {applicationMessage ? (
                <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                  {applicationMessage}
                </div>
              ) : null}

              {isExternalJob && job.sourceUrl ? (
                <div className="mt-4 space-y-3">
                  <Button as="a" href={job.sourceUrl} target="_blank" rel="noreferrer" className="w-full">
                    Open Original Listing
                  </Button>
                  <Button as={Link} to="/jobs" variant="secondary" className="w-full">
                    Back to jobs
                  </Button>
                </div>
              ) : isAuthenticated && ["jobseeker", "admin"].includes(user?.role) ? (
                <form className="mt-4 space-y-3" onSubmit={handleApply}>
                  <textarea
                    className="min-h-36 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                    placeholder="Tell the employer why you're a great fit..."
                    value={form.coverLetter}
                    onChange={(event) => setForm({ coverLetter: event.target.value })}
                  />
                  <Button className="w-full" type="submit" disabled={applying}>
                    {applying ? "Submitting..." : "Apply to this job"}
                  </Button>
                  <Button as={Link} to="/jobs" variant="secondary" className="w-full">
                    Back to jobs
                  </Button>
                </form>
              ) : isAuthenticated ? (
                <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  Only job seekers can apply to jobs.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <Button as={Link} to="/login" className="w-full">
                    Login to apply
                  </Button>
                  <Button as={Link} to="/jobs" variant="secondary" className="w-full">
                    Back to jobs
                  </Button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </PageShell>
  );
};

export default JobDetailsPage;
