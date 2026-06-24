import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PageShell from "../_PageShell";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Badge } from "../../components/ui/Badge";
import { Loader } from "../../components/ui/Loader";
import { jobService } from "../../services/jobService";
import { getErrorMessage } from "../../services/error";
import { useAuth } from "../../context/AuthContext";
import { userService } from "../../services/userService";

const createDefaultFilters = () => ({
  q: "",
  location: "",
  skill: "",
  jobType: "all",
  remote: false,
  sort: "latest",
});

const normalizeSkill = (skill) => String(skill || "").trim();

const uniqueSkills = (skills = []) => {
  const seen = new Set();

  return skills.map(normalizeSkill).filter(Boolean).filter((skill) => {
    const key = skill.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

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
  const { user, isAuthenticated, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [filters, setFilters] = useState(createDefaultFilters);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingJobId, setSavingJobId] = useState("");

  const updateFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters(createDefaultFilters());
  };

  const savedJobIds = new Set(Array.isArray(user?.savedJobs) ? user.savedJobs : []);

  const handleToggleSavedJob = async (job) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }

    setSavingJobId(job._id);
    setError("");

    try {
      const { data } = savedJobIds.has(job._id)
        ? await userService.removeSavedJob(job._id)
        : await userService.saveJob(job._id);

      if (data.user) {
        updateUser(data.user);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update saved jobs"));
    } finally {
      setSavingJobId("");
    }
  };

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

        if (filters.skill) {
          params.skill = filters.skill;
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
  }, [filters.q, filters.location, filters.skill, filters.jobType, filters.remote, filters.sort]);

  const selectedSkill = normalizeSkill(filters.skill);
  const profileSkills = uniqueSkills(Array.isArray(user?.skills) ? user.skills : []);
  const profileLocation = normalizeSkill(user?.location);
  const popularSkills = uniqueSkills(
    jobs.flatMap((job) => (Array.isArray(job.skills) ? job.skills : []))
  ).filter((skill) => !profileSkills.some((ownedSkill) => ownedSkill.toLowerCase() === skill.toLowerCase()));
  const quickSkills = uniqueSkills([...profileSkills, ...popularSkills]).slice(0, 8);

  const activeFilters = [
    filters.q
      ? {
          label: `Keyword: ${filters.q}`,
          onClear: () => updateFilter("q", ""),
        }
      : null,
    filters.location
      ? {
          label: `Location: ${filters.location}`,
          onClear: () => updateFilter("location", ""),
        }
      : null,
    selectedSkill
      ? {
          label: `Skill: ${selectedSkill}`,
          onClear: () => updateFilter("skill", ""),
        }
      : null,
    filters.jobType !== "all"
      ? {
          label: `Type: ${filters.jobType}`,
          onClear: () => updateFilter("jobType", "all"),
        }
      : null,
    filters.remote
      ? {
          label: "Remote only",
          onClear: () => updateFilter("remote", false),
        }
      : null,
  ].filter(Boolean);

  const visibleJobs = jobs.filter((job) => {
    const jobText = [
      job.title,
      job.employer?.companyName,
      job.location,
      job.category,
      job.description,
      Array.isArray(job.skills) ? job.skills.join(" ") : "",
    ]
      .join(" ")
      .toLowerCase();

    const matchesQuery = !filters.q || jobText.includes(filters.q.toLowerCase());
    const matchesLocation = !filters.location || (job.location || "").toLowerCase().includes(filters.location.toLowerCase());
    const matchesSkill = !selectedSkill || jobText.includes(selectedSkill.toLowerCase());
    const matchesType = filters.jobType === "all" || (job.jobType || "").toLowerCase() === filters.jobType;
    const matchesRemote = !filters.remote || job.remote;

    return matchesQuery && matchesLocation && matchesSkill && matchesType && matchesRemote;
  });

  return (
    <PageShell
      title="Browse jobs"
      description="Search the latest open roles and filter by skill, location, remote work, or role type."
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
            onChange={(event) => updateFilter("q", event.target.value)}
          />

          <Input
            type="text"
            label="Location"
            placeholder="Remote, Bangalore, Pune..."
            value={filters.location}
            onChange={(event) => updateFilter("location", event.target.value)}
          />

          <Input
            type="text"
            label="Skill"
            placeholder="React, Node.js, Python..."
            value={filters.skill}
            onChange={(event) => updateFilter("skill", event.target.value)}
          />

          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Smart picks</p>
                <p className="mt-1 text-xs text-slate-400">Tap a skill from your profile or the live feed.</p>
              </div>
              {profileLocation ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => updateFilter("location", profileLocation)}
                >
                  Use my location
                </Button>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {quickSkills.length > 0 ? (
                quickSkills.map((skill) => {
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
                })
              ) : (
                <p className="text-xs text-slate-500">Add skills to your profile to get personalized picks.</p>
              )}
            </div>
          </div>

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
            value={filters.sort}
            label="Sort"
            onChange={(event) => updateFilter("sort", event.target.value)}
          >
            <option value="latest">Latest</option>
            <option value="salary">Salary</option>
          </Select>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={filters.remote}
              onChange={(event) => updateFilter("remote", event.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-transparent text-cyan-400 focus:ring-cyan-400"
            />
            Remote only
          </label>

          <Button type="button" variant="secondary" className="w-full" onClick={resetFilters}>
            Reset Filters
          </Button>
        </aside>

        <div className="space-y-5">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Open roles</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Search jobs across every track</h2>
                <p className="mt-2 text-sm text-slate-400">
                  {profileSkills.length > 0
                    ? `Your profile skills are helping tune the results: ${profileSkills.slice(0, 3).join(", ")}.`
                    : "Add skills to your profile to unlock more relevant suggestions."}
                </p>
              </div>
              <div className="text-left lg:text-right">
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Badge variant="info">{visibleJobs.length} roles visible</Badge>
                  <Badge variant="success">{savedJobIds.size} saved</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {jobs.length > 0 ? `${jobs.length} listings loaded.` : "Waiting for live listings."}
                </p>
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
                        {job.external ? <Badge variant="warning">{job.sourceName || "External"}</Badge> : null}
                        {job.remote ? <Badge variant="success">Remote</Badge> : null}
                        {savedJobIds.has(job._id) ? <Badge variant="info">Saved</Badge> : null}
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
                      <Button
                        type="button"
                        variant={savedJobIds.has(job._id) ? "secondary" : "ghost"}
                        onClick={() => void handleToggleSavedJob(job)}
                        disabled={savingJobId === job._id}
                      >
                        {savingJobId === job._id ? "Saving..." : savedJobIds.has(job._id) ? "Unsave" : "Save Job"}
                      </Button>
                      <Button as={Link} to={`/jobs/${job._id}`} variant="secondary">
                        View Details
                      </Button>
                      {job.external ? (
                        <Button as="a" href={job.sourceUrl} target="_blank" rel="noreferrer">
                          Open Source
                        </Button>
                      ) : (
                        <Button as={Link} to={`/jobs/${job._id}#apply`}>
                          Quick Apply
                        </Button>
                      )}
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
