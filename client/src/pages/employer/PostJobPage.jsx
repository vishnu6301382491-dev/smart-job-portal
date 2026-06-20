import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageShell from "../_PageShell";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { jobService } from "../../services/jobService";
import { getErrorMessage } from "../../services/error";
import { getJobStatusMeta } from "../../utils/jobStatus";

const PostJobPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    requirements: "",
    responsibilities: "",
    location: "",
    jobType: "full-time",
    salaryMin: "",
    salaryMax: "",
    currency: "USD",
    experienceLevel: "entry",
    remote: false,
    category: "",
    skills: "",
    deadline: "",
    status: "draft",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        ...form,
        remote: form.remote,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
      };

      const { data } = await jobService.create(payload);
      setMessage(data.message || "Job posted successfully");
      navigate("/employer");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to publish job"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Post a job"
      description="Save a draft first or publish a new opening with structured details, salary range, and requirements."
      actions={[]}
    >
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="md:col-span-2">
          <Badge variant="info">Employer posting workflow</Badge>
        </div>
        {error ? (
          <div className="md:col-span-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="md:col-span-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
            {message}
          </div>
        ) : null}
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
        <Select
          value={form.currency}
          label="Currency"
          onChange={(event) => setForm({ ...form, currency: event.target.value })}
        >
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
          <span className="font-medium text-[var(--page-text)]">Current status:</span>{" "}
          {getJobStatusMeta(form.status).label}. Draft jobs stay private until you publish them.
        </div>
        <Input
          className="md:col-span-2"
          label="Skills"
          type="text"
          placeholder="React, Node.js, MongoDB"
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
          placeholder="Comma-separated skills or bullet points"
          value={form.requirements}
          onChange={(event) => setForm({ ...form, requirements: event.target.value })}
        />
        <Textarea
          className="md:col-span-2"
          label="Responsibilities"
          placeholder="Comma-separated responsibilities"
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
        <div className="md:col-span-2 flex items-center justify-between gap-3">
          <Button as={Link} to="/employer" variant="secondary" type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : form.status === "draft" ? "Save Draft" : form.status === "closed" ? "Save Job" : "Publish Job"}
          </Button>
        </div>
      </form>
    </PageShell>
  );
};

export default PostJobPage;
