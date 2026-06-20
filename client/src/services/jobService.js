import api from "./api";

export const jobService = {
  list: (params) => api.get("/jobs", { params }),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (payload) => api.post("/jobs", payload),
  update: (id, payload) => api.put(`/jobs/${id}`, payload),
  remove: (id) => api.delete(`/jobs/${id}`),
  myJobs: () => api.get("/jobs/my"),
  apply: (jobId, payload) => api.post(`/applications/${jobId}`, payload),
  myApplications: () => api.get("/applications/me"),
};

