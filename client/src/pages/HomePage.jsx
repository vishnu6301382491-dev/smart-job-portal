import PageShell from "./_PageShell";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Link } from "react-router-dom";

const featuredRoles = [
  {
    title: "Frontend Developer",
    company: "Northwind Labs",
    location: "Remote",
    type: "Full-time",
    badge: "React",
  },
  {
    title: "Product Designer",
    company: "Aster Studio",
    location: "Mumbai, India",
    type: "Contract",
    badge: "UI/UX",
  },
  {
    title: "Operations Analyst",
    company: "Gridline",
    location: "Bangalore, India",
    type: "Hybrid",
    badge: "Analytics",
  },
];

const stats = [
  { label: "Open roles", value: "1,248" },
  { label: "Applications", value: "9,534" },
  { label: "Employers", value: "314" },
  { label: "Response time", value: "24h" },
];

const HomePage = () => {
  return (
    <PageShell
      title="Find the right job faster."
      description="A polished local-first job portal for jobseekers, employers, and admins with a clean dashboard experience."
      actions={[
        { label: "Browse Jobs", href: "/jobs" },
        { label: "Create Account", href: "/register", variant: "secondary" },
      ]}
    >
      <div className="space-y-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-400/10 via-white/5 to-slate-900 p-6 shadow-glow">
            <Badge variant="info">Fast local-first hiring</Badge>
            <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              One portal for job discovery, applications, company profiles, and admin oversight.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Search live openings, manage company branding, and keep the workflow clean with a modern dashboard that works
              locally and deploys on free-tier hosting.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button as={Link} to="/jobs">
                Explore Jobs
              </Button>
              <Button as={Link} to="/register" variant="secondary">
                Start Free
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-medium text-white">Who it serves</p>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-sm font-semibold text-cyan-300">Job Seekers</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Build a profile, upload a resume, search jobs, and track every application in one place.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-sm font-semibold text-cyan-300">Employers</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Publish jobs, edit openings, and review applicants from a focused employer dashboard.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-sm font-semibold text-cyan-300">Admins</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Monitor users, jobs, and employers with moderation tools and clean statistics.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Featured roles</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">A few roles to explore</h3>
            </div>
            <Button as={Link} to="/jobs" variant="ghost">
              View all
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {featuredRoles.map((job) => (
              <article key={job.title} className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:border-cyan-400/30">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{job.title}</h4>
                    <p className="mt-1 text-sm text-slate-400">{job.company}</p>
                  </div>
                  <Badge variant="neutral">{job.type}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-300">
                  <span className="rounded-full bg-white/5 px-3 py-1">{job.location}</span>
                  <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-cyan-200">{job.badge}</span>
                </div>
                <div className="mt-5 flex justify-end">
                  <Button as={Link} to="/jobs" variant="secondary">
                    Open role
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
};

export default HomePage;
