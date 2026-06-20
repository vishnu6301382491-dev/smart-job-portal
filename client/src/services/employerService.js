import api from "./api";

export const employerService = {
  getProfile: () => api.get("/employers/profile"),
  upsertProfile: (payload) => api.post("/employers/profile", payload),
  dashboard: () => api.get("/employers/dashboard"),
};

