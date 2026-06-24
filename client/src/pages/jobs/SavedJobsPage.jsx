import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../_PageShell";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Loader } from "../../components/ui/Loader";
import { userService } from "../../services/userService";
import { getErrorMessage } from "../../services/error";
import { useAuth } from "../../context/AuthContext";

const createDefaultFilters = () => ({
  q: "",
  location: "",
  skill: "",
  jobType: "all",
  source: "all",
  remote: false,
  sort: "saved-order",
});

const normalizeText = (value) => String(value || "").trim();

const uniqueValues = (values = []) => {
  const seen = new Set();

  return values.map(normalizeText).filter(Boolean).filter((value) => {
    const key = value.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

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

const SavedJobsPage = () => {
  const { updateUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState(createDefaultFilters);
  const [loading, setLoading] = useState(true);
  const [savingJobId, setSavingJobId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadSavedJobs = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await userService.savedJobs();

        if (cancelled) {
          return;
        }

        setJobs(data.jobs || []);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Unable to load saved jobs"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSavedJobs();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters(createDefaultFilters());
  };

  const handleRemoveSavedJob = async (jobId) => {
    setSavingJobId(jobId);
    setError("");

    try {
      const { data } = await userService.removeSavedJob(jobId);
      setJobs(data.jobs || []);

      if (data.user) {
        updateUser(data.user);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update saved jobs"));
    } finally {
      setSavingJobId("");
    }
  };

  const selectedSkill = normalizeText(filters.skill);
  const visibleJobs = jobs
    .filter((job) => {
      const haystack = [
        job.title,
        job.description,
        job.location,
        job.category,
        job.employer?.companyName,
        Array.isArray(job.skills) ? job.skills.join(" ") : "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !filters.q || haystack.includes(filters.q.toLowerCase());
      const matchesLocation = !filters.location || (job.location || "").toLowerCase().includes(filters.location.toLowerCase());
      const matchesSkill = !selectedSkill || haystack.includes(selectedSkill.toLowerCase());
      const matchesType = filters.jobType === "all" || (job.jobType || "").toLowerCase() === filters.jobType;
      const matchesSource =
        filters.source === "all" ||
        (filters.source === "external" && job.external) ||
        (filters.source === "local" && !job.external);
      const matchesRemote = !filters.remote || job.remote;

      return matchesQuery && matchesLocation && matchesSkill && matchesType && matchesSource && matchesRemote;
    })
    .sort((a, b) => {
      if (filters.sort === "salary") {
        const aSalary = Number(a.salaryMax || a.salaryMin || 0);
        const bSalary = Number(b.salaryMax || b.salaryMin || 0);
        return bSalary - aSalary;
      }

      if (filters.sort === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }

      if (filters.sort === "latest") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }

      return 0;
    });

  const activeFilters = [
    filters.q
      ? { label: `Keyword: ${filters.q}`, onClear: () => updateFilter("q", "") }
      : null,
    filters.location
      ? { label: `Location: ${filters.location}`, onClear: () => updateFilter("location", "") }
      : null,
    selectedSkill
      ? { label: `Skill: ${selectedSkill}`, onClear: () => updateFilter("skill", "") }
      : null,
    filters.jobType !== "all"
      ? { label: `Type: ${filters.jobType}`, onClear: () => updateFilter("jobType", "all") }
      : null,
    filters.source !== "all"
      ? { label: `Source: ${filters.source}`, onClear: () => updateFilter("source", "all") }
      : null,
    filters.remote
      ? { label: "Remote only", onClear: () => updateFilter("remote", false) }
      : null,
  ].filter(Boolean);

  const quickSkills = uniqueValues(
    jobs.flatMap((job) => (Array.isArray(job.skills) ? job.skills : []))
  ).slice(0, 8);

  return (
    <PageShell
      title="Saved jobs"
      description="Keep track of the roles you want to revisit and trim the list whenever you’re ready."
      actions={[{ label: "Browse Jobs", href: "/jobs", variant: "secondary" }]}
    >
      {loading ? (
        <Loader label="Loading saved jobs" />
      ) : error ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-200">
          {error}
        </div>
      ) : jobs.length > 0 ? (
        <div className="space-y-5">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Saved shortlist</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Trim your saved roles with smart filters</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Use saved jobs as a shortlist, then narrow them by skill, location, source, or job type.
                </p>
              </div>
              <div className="text-left lg:text-right">
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Badge variant="info">{visibleJobs.length} visible</Badge>
                  <Badge variant="success">{jobs.length} saved</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-400">Bookmark cleanup is one click away whenever you need it.</p>
              </div>
            </div>

            {activeFilters.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <button
                    key={filter.label}
                    type="button"
                    onClick={filter.onClear}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:border-cyan-400/30 hover:text-white"
                  >
                    {filter.label}
                    <span className="text-slate-500">x</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <aside className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 xl:grid-cols-[1fr_1fr_1fr]">
            <Input
              type="search"
              label="Keyword"
              placeholder="React, product, analyst..."
              value={filters.q}
              onChange={(event) => updateFilter("q", event.target.value)}
            />
            <Input
              type="text"
              label="Location"
              placeholder="Remote, Bangalore..."
              value={filters.location}
              onChange={(event) => updateFilter("location", event.target.value)}
            />
            <Input
              type="text"
              label="Skill"
              placeholder="Node.js, design, Python..."
              value={filters.skill}
              onChange={(event) => updateFilter("skill", event.target.value)}
            />

            <Select
              value={filters.jobType}
              label="Job Type"
              onChange={(event) => updateFilter("jobType", event.target.value)}
            >
              <option value="all">All Types</option>
              <option value="full-time">Full-time</option>
              <option value="contract">Contract</option>
              <option value="part-time">Part-time</option>
              <option value="internship">Internship</option>
              <option value="freelance">Freelance</option>
            </Select>
            <Select
              value={filters.source}
              label="Source"
              onChange={(event) => updateFilter("source", event.target.value)}
            >
              <option value="all">All Sources</option>
              <option value="local">Local only</option>
              <option value="external">External only</option>
            </Select>
            <Select
              value={filters.sort}
              label="Sort"
              onChange={(event) => updateFilter("sort", event.target.value)}
            >
              <option value="saved-order">Saved order</option>
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
              <option value="salary">Salary</option>
            </Select>

            <div className="flex items-end gap-3 xl:col-span-3">
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={filters.remote}
                  onChange={(event) => updateFilter("remote", event.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-transparent text-cyan-400 focus:ring-cyan-400"
                />
                Remote only
              </label>

              <div className="flex flex-wrap gap-2">
                {quickSkills.map((skill) => {
                  const isSelected = selectedSkill.toLowerCase() === skill.toLowerCase();

                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => updateFilter("skill", isSelected ? "" : skill)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition ${
                        isSelected
                          ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-200"
                          : "border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/30 hover:text-white"
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>

              <div className="ml-auto">
                <Button type="button" variant="secondary" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </div>
            </div>
          </aside>

          {visibleJobs.length > 0 ? (
            <div className="space-y-4">
              {visibleJobs.map((job) => (
            <article
              key={job._id}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/30"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold text-white">{job.title}</h3>
                    {job.external ? <Badge variant="warning">{job.sourceName || "External"}</Badge> : null}
                    {job.remote ? <Badge variant="success">Remote</Badge> : null}
                    <Badge variant="info">Saved</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{job.employer?.companyName || "Independent employer"}</p>
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">{job.description}</p>
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
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={savingJobId === job._id}
                    onClick={() => void handleRemoveSavedJob(job._id)}
                  >
                    {savingJobId === job._id ? "Removing..." : "Remove"}
                  </Button>
                  <Button as={Link} to={`/jobs/${job._id}`} variant="secondary">
                    View Details
                  </Button>
                  {job.external ? (
                    <Button as="a" href={job.sourceUrl} target="_blank" rel="noreferrer">
                      Open Source
                    </Button>
                  ) : null}
                </div>
              </div>
            </article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-300">
              No saved jobs matched your filters. Try broadening the search or clearing one of the chips above.
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          You haven’t saved any jobs yet. Bookmark roles from the Jobs page to come back to them later.
        </div>
      )}
    </PageShell>
  );
};

export default SavedJobsPage;
