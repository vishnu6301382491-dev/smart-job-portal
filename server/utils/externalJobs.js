const EXTERNAL_SOURCE = "arbeitnow";
const EXTERNAL_API_URL = "https://www.arbeitnow.com/api/job-board-api";
const CACHE_TTL_MS = 10 * 60 * 1000;

let cache = {
  fetchedAt: 0,
  jobs: [],
};

const stripHtml = (html = "") =>
  String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeText = (value) => String(value || "").toLowerCase();

const parseQueryList = (value) => {
  if (!value) {
    return [];
  }

  const items = Array.isArray(value) ? value : String(value).split(",");

  return items.map((item) => String(item).trim()).filter(Boolean);
};

const genericTags = new Set([
  "remote",
  "it",
  "information technology",
  "software development",
  "engineering",
  "technology",
  "consulting",
  "management",
  "administration",
  "building",
]);

const parseCreatedAt = (value) => {
  if (value === null || value === undefined) {
    return new Date();
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    const millis = numeric < 1_000_000_000_000 ? numeric * 1000 : numeric;
    return new Date(millis);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const normalizeJobType = (jobTypes = []) => {
  const text = normalizeText(jobTypes.join(" "));

  if (text.includes("freelance") || text.includes("contract")) {
    return "contract";
  }

  if (text.includes("intern") || text.includes("student") || text.includes("entry")) {
    return "internship";
  }

  if (text.includes("part time") || text.includes("part-time") || text.includes("teilzeit")) {
    return "part-time";
  }

  return "full-time";
};

const inferExperienceLevel = (jobTypes = [], tags = []) => {
  const text = normalizeText([...jobTypes, ...tags].join(" "));

  if (text.includes("senior") || text.includes("lead") || text.includes("experienced")) {
    return "senior";
  }

  if (text.includes("mid")) {
    return "mid";
  }

  if (text.includes("intern") || text.includes("student") || text.includes("entry")) {
    return "entry";
  }

  return "mid";
};

const inferSkills = (tags = [], title = "", description = "") => {
  const rawSkills = [...tags];
  const text = `${title} ${description}`.toLowerCase();

  const keywords = [
    "javascript",
    "typescript",
    "react",
    "node",
    "node.js",
    "python",
    "java",
    "go",
    "golang",
    "aws",
    "sql",
    "mongodb",
    "postgresql",
    "docker",
    "kubernetes",
    "graphql",
    "php",
    "ruby",
    "c#",
    ".net",
    "flutter",
    "android",
    "ios",
    "ui/ux",
    "design",
    "product",
    "marketing",
    "sales",
  ];

  for (const keyword of keywords) {
    if (text.includes(keyword) && !rawSkills.some((skill) => normalizeText(skill) === keyword)) {
      rawSkills.push(keyword);
    }
  }

  return rawSkills
    .map((skill) => String(skill).trim())
    .filter(Boolean)
    .filter((skill) => !genericTags.has(normalizeText(skill)))
    .filter((skill, index, array) => array.findIndex((item) => item.toLowerCase() === skill.toLowerCase()) === index)
    .slice(0, 8);
};

const mapExternalJob = (item) => {
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const jobTypes = Array.isArray(item.job_types) ? item.job_types : [];
  const title = item.title || "Untitled role";
  const companyName = item.company_name || "Arbeitnow";
  const location = item.location || "Remote";
  const description = stripHtml(item.description);
  const createdAt = parseCreatedAt(item.created_at);
  const category = tags.find((tag) => !genericTags.has(normalizeText(tag))) || "External listing";

  return {
    _id: `external:${EXTERNAL_SOURCE}:${item.slug || Buffer.from(`${title}:${companyName}`).toString("base64url")}`,
    source: EXTERNAL_SOURCE,
    sourceName: "Arbeitnow",
    sourceUrl: item.url || EXTERNAL_API_URL,
    external: true,
    title,
    description,
    requirements: [],
    responsibilities: [],
    location,
    jobType: normalizeJobType(jobTypes),
    salaryMin: null,
    salaryMax: null,
    currency: "EUR",
    experienceLevel: inferExperienceLevel(jobTypes, tags),
    remote: Boolean(item.remote),
    category,
    skills: inferSkills(tags, title, description),
    status: "open",
    employer: {
      companyName,
      location,
      website: item.url || "",
    },
    postedBy: null,
    applicantsCount: 0,
    createdAt,
    updatedAt: createdAt,
  };
};

const isExternalJobId = (id) => typeof id === "string" && id.startsWith(`external:${EXTERNAL_SOURCE}:`);

const matchesQuery = (job, query = {}) => {
  if (query.status && query.status !== "open") {
    return false;
  }

  if (query.remote === "true" && !job.remote) {
    return false;
  }

  if (query.jobType && job.jobType !== query.jobType) {
    return false;
  }

  if (query.location && !normalizeText(job.location).includes(normalizeText(query.location))) {
    return false;
  }

  if (query.category && !normalizeText(job.category).includes(normalizeText(query.category))) {
    return false;
  }

  const selectedSkills = parseQueryList(query.skill ?? query.skills);
  if (selectedSkills.length > 0) {
    const haystack = [
      job.title,
      job.description,
      job.location,
      job.category,
      job.employer?.companyName,
      ...(job.skills || []),
    ]
      .map(normalizeText)
      .join(" ");

    if (!selectedSkills.some((skill) => haystack.includes(normalizeText(skill)))) {
      return false;
    }
  }

  if (query.q) {
    const haystack = [
      job.title,
      job.description,
      job.location,
      job.category,
      job.employer?.companyName,
      ...(job.skills || []),
    ]
      .map(normalizeText)
      .join(" ");

    if (!haystack.includes(normalizeText(query.q))) {
      return false;
    }
  }

  return true;
};

const fetchExternalJobs = async (query = {}) => {
  const now = Date.now();

  if (now - cache.fetchedAt < CACHE_TTL_MS && cache.jobs.length > 0) {
    return cache.jobs.filter((job) => matchesQuery(job, query));
  }

  try {
    const response = await fetch(EXTERNAL_API_URL, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`External jobs request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const jobs = Array.isArray(payload?.data) ? payload.data.map(mapExternalJob) : [];

    cache = {
      fetchedAt: now,
      jobs,
    };

    return jobs.filter((job) => matchesQuery(job, query));
  } catch (error) {
    console.error(`External jobs fetch failed: ${error.message}`);
    return [];
  }
};

const getExternalJobById = async (id) => {
  if (!isExternalJobId(id)) {
    return null;
  }

  const cachedJob = cache.jobs.find((job) => job._id === id);
  if (cachedJob) {
    return cachedJob;
  }

  const jobs = await fetchExternalJobs();
  return jobs.find((job) => job._id === id) || null;
};

export { EXTERNAL_SOURCE, fetchExternalJobs, getExternalJobById, isExternalJobId };
