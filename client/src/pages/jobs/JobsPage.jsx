import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../_PageShell";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Badge } from "../../components/ui/Badge";
import { Loader } from "../../components/ui/Loader";
import { jobService } from "../../services/jobService";
import { getErrorMessage } from "../../services/error";

const formatSalary = (job) => {
  if (!job.salaryMin && !job.salaryMax) {
    return "Salary not specified";
  }

  const currency = job.currency || "USD";

  if (job.salaryMin && job.salaryMax) {
    return `${currency} ${job.salaryMin} - ${currency} ${job.salaryMax}`;
  }

  return `${currency} ${job.salaryMin || job.salaryMax}`;
};

const JobsPage = () => {
  const [filters, setFilters] = useState({
    q: "",
    location: "",
    jobType: "all",
    remote: false,
    sort: "latest",
  });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadJobs = async () => {
      setLoading(true);
      setError("");

      try {
        const params = {};

        if (filters.q) {
          params.q = filters.q;
        }

        if (filters.location) {
          params.location = filters.location;
        }

        if (filters.jobType !== "all") {
          params.jobType = filters.jobType;
        }

        if (filters.remote) {
          params.remote = "true";
        }

        const { data } = await jobService.list(params);

        if (cancelled) {
          return;
        }

        const sortedJobs = [...(data.jobs || [])].sort((a, b) => {
          if (filters.sort === "salary") {
            const aSalary = Number(a.salaryMax || a.salaryMin || 0);
            const bSalary = Number(b.salaryMax || b.salaryMin || 0);
            return bSalary - aSalary;
          }

          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        setJobs(sortedJobs);
      } catch (err) {
        if (!cancelled) {
          setJobs([]);
          setError(getErrorMessage(err, "Unable to load jobs"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const timeout = setTimeout(loadJobs, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [filters.q, filters.location, filters.jobType, filters.remote, filters.sort]);

  const visibleJobs = jobs.filter((job) => {
    const matchesQuery =
      !filters.q ||
      [job.title, job.employer?.companyName, job.location, Array.isArray(job.skills) ? job.skills.join(" ") : ""]
        .join(" ")
        .toLowerCase()
        .includes(filters.q.toLowerCase());
    const matchesLocation = !filters.location || (job.location || "").toLowerCase().includes(filters.location.toLowerCase());
    const matchesType = filters.jobType === "all" || (job.jobType || "").toLowerCase() === filters.jobType;
    const matchesRemote = !filters.remote || job.remote;

    return matchesQuery && matchesLocation && matchesType && matchesRemote;
  });

  return (
    <PageShell
      title="Browse jobs"
      description="Search the latest open roles and filter by location, remote work, or role type."
      actions={[]}
    >
      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div>
            <p className="text-sm font-semibold text-white">Filters</p>
            <p className="mt-1 text-sm text-slate-400">Refine your search to the roles that matter.</p>
          </div>
          <Input
            type="search"
            label="Keyword"
            placeholder="Developer, design, analyst..."
            value={filters.q}
            onChange={(event) => setFilters({ ...filters, q: event.target.value })}
          />
          <Input
            type="text"
            label="Location"
            placeholder="Remote, Bangalore, Pune..."
            value={filters.location}
            onChange={(event) => setFilters({ ...filters, location: event.target.value })}
          />
          <Select
            value={filters.jobType}
            label="Job Type"
            onChange={(event) => setFilters({ ...filters, jobType: event.target.value })}
          >
            <option value="all">All Types</option>
            <option value="full-time">Full-time</option>
            <option value="contract">Contract</option>
            <option value="part-time">Part-time</option>
            <option value="internship">Internship</option>
            <option value="freelance">Freelance</option>
          </Select>
          <Select
            value={filters.sort}
            label="Sort"
            onChange={(event) => setFilters({ ...filters, sort: event.target.value })}
          >
            <option value="latest">Latest</option>
            <option value="salary">Salary</option>
          </Select>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={filters.remote}
              onChange={(event) => setFilters({ ...filters, remote: event.target.checked })}
              className="h-4 w-4 rounded border-slate-700 bg-transparent text-cyan-400 focus:ring-cyan-400"
            />
            Remote only
          </label>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => setFilters({ q: "", location: "", jobType: "all", remote: false, sort: "latest" })}
          >
            Reset Filters
          </Button>
        </aside>

        <div className="space-y-5">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Open roles</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Search jobs across every track</h2>
              </div>
              <Badge variant="info">{visibleJobs.length} roles visible</Badge>
            </div>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <Loader label="Loading jobs" />
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-200">
              {error}
            </div>
          ) : visibleJobs.length > 0 ? (
            <div className="grid gap-4">
              {visibleJobs.map((job) => (
                <article
                  key={job._id}
                  className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/6 to-slate-950/50 p-5 transition hover:border-cyan-400/30 hover:shadow-glow"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold text-white">{job.title}</h3>
                        {job.remote ? <Badge variant="success">Remote</Badge> : null}
                        {job.status === "open" ? <Badge variant="info">Open</Badge> : <Badge variant="warning">Closed</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-slate-400">{job.employer?.companyName || "Independent employer"}</p>
                    </div>
                    <div className="text-left lg:text-right">
                      <p className="text-sm font-medium text-white">{formatSalary(job)}</p>
                      <p className="text-sm text-slate-400">{job.location}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(job.skills || []).map((skill) => (
                      <Badge key={skill}>{skill}</Badge>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <Badge variant="neutral">{job.jobType}</Badge>
                    <div className="flex gap-2">
                      <Button as={Link} to={`/jobs/${job._id}`} variant="secondary">
                        View Details
                      </Button>
                      <Button as={Link} to={`/jobs/${job._id}#apply`}>
                        Quick Apply
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-300">
              No jobs matched your filters. Try broadening your search.
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default JobsPage;
