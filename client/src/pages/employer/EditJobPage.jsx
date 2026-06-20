import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageShell from "../_PageShell";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Loader } from "../../components/ui/Loader";
import { jobService } from "../../services/jobService";
import { getErrorMessage } from "../../services/error";
import { getJobStatusMeta } from "../../utils/jobStatus";

const EditJobPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    jobType: "full-time",
    location: "",
    category: "",
    description: "",
    responsibilities: "",
    requirements: "",
    salaryMin: "",
    salaryMax: "",
    currency: "USD",
    experienceLevel: "entry",
    remote: false,
    status: "open",
    skills: "",
    deadline: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadJob = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await jobService.getById(id);

        if (cancelled) {
          return;
        }

        const job = data.job;
        setForm({
          title: job.title || "",
          jobType: job.jobType || "full-time",
          location: job.location || "",
          category: job.category || "",
          description: job.description || "",
          responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities.join(", ") : "",
          requirements: Array.isArray(job.requirements) ? job.requirements.join(", ") : "",
          salaryMin: job.salaryMin || "",
          salaryMax: job.salaryMax || "",
          currency: job.currency || "USD",
          experienceLevel: job.experienceLevel || "entry",
          remote: Boolean(job.remote),
          status: job.status || "open",
          skills: Array.isArray(job.skills) ? job.skills.join(", ") : "",
          deadline: job.deadline ? String(job.deadline).slice(0, 10) : "",
        });
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        ...form,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
      };
      const { data } = await jobService.update(id, payload);
      setMessage(data.message || "Job updated successfully");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update this job"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this job? This cannot be undone.");

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await jobService.remove(id);
      navigate("/employer");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to delete this job"));
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell py-12">
        <Loader label="Loading job" />
      </div>
    );
  }

  return (
    <PageShell
      title="Edit job"
      description={`Update the posting details for job ID ${id}.`}
      actions={[]}
    >
      {error ? (
        <div className="mb-5 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-200">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="mb-5 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6 text-sm text-cyan-100">
          {message}
        </div>
      ) : null}
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="md:col-span-2">
          <Badge variant={getJobStatusMeta(form.status).variant}>Editing {getJobStatusMeta(form.status).label} job</Badge>
        </div>
        <Input
          label="Title"
          type="text"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
        />
        <Select
          value={form.jobType}
          label="Job Type"
          onChange={(event) => setForm({ ...form, jobType: event.target.value })}
        >
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="internship">Internship</option>
          <option value="freelance">Freelance</option>
        </Select>
        <Input
          label="Location"
          type="text"
          value={form.location}
          onChange={(event) => setForm({ ...form, location: event.target.value })}
        />
        <Input
          label="Category"
          type="text"
          value={form.category}
          onChange={(event) => setForm({ ...form, category: event.target.value })}
        />
        <Input
          label="Minimum Salary"
          type="number"
          value={form.salaryMin}
          onChange={(event) => setForm({ ...form, salaryMin: event.target.value })}
        />
        <Input
          label="Maximum Salary"
          type="number"
          value={form.salaryMax}
          onChange={(event) => setForm({ ...form, salaryMax: event.target.value })}
        />
        <Select
          value={form.experienceLevel}
          label="Experience"
          onChange={(event) => setForm({ ...form, experienceLevel: event.target.value })}
        >
          <option value="entry">Entry</option>
          <option value="mid">Mid</option>
          <option value="senior">Senior</option>
          <option value="lead">Lead</option>
        </Select>
        <Select value={form.currency} label="Currency" onChange={(event) => setForm({ ...form, currency: event.target.value })}>
          <option value="USD">USD</option>
          <option value="INR">INR</option>
          <option value="EUR">EUR</option>
        </Select>
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={form.remote}
            onChange={(event) => setForm({ ...form, remote: event.target.checked })}
            className="h-4 w-4 rounded border-slate-700 bg-transparent text-cyan-400 focus:ring-cyan-400"
          />
          Remote friendly
        </label>
        <Select value={form.status} label="Status" onChange={(event) => setForm({ ...form, status: event.target.value })}>
          <option value="draft">Draft</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </Select>
        <div className="md:col-span-2 rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--page-text-soft)]">
          <span className="font-medium text-[var(--page-text)]">Status tip:</span> Draft keeps the job private. Open makes it visible. Closed stops new applications.
        </div>
        <Input
          className="md:col-span-2"
          label="Skills"
          type="text"
          value={form.skills}
          onChange={(event) => setForm({ ...form, skills: event.target.value })}
        />
        <Textarea
          className="md:col-span-2"
          label="Description"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <Textarea
          className="md:col-span-2"
          label="Requirements"
          value={form.requirements}
          onChange={(event) => setForm({ ...form, requirements: event.target.value })}
        />
        <Textarea
          className="md:col-span-2"
          label="Responsibilities"
          value={form.responsibilities}
          onChange={(event) => setForm({ ...form, responsibilities: event.target.value })}
        />
        <Input
          className="md:col-span-2"
          label="Deadline"
          type="date"
          value={form.deadline}
          onChange={(event) => setForm({ ...form, deadline: event.target.value })}
        />
        <div className="md:col-span-2 flex items-center justify-end gap-3">
          <Button variant="secondary" type="button" onClick={handleDelete} disabled={saving}>
            Delete Job
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </PageShell>
  );
};

export default EditJobPage;
