import api from "./api";

export const adminService = {
  stats: () => api.get("/admin/stats"),
  users: () => api.get("/admin/users"),
  updateUserRole: (id, payload) => api.patch(`/admin/users/${id}/role`, payload),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/status`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  jobs: () => api.get("/admin/jobs"),
  jobHistory: (id) => api.get(`/admin/jobs/${id}/history`),
  deleteJob: (id) => api.delete(`/admin/jobs/${id}`),
  employers: () => api.get("/admin/employers"),
  deleteEmployer: (id) => api.delete(`/admin/employers/${id}`),
};
