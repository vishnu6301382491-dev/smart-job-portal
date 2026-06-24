import api from "./api";

export const userService = {
  me: () => api.get("/users/me"),
  updateProfile: (payload) => api.put("/users/me", payload),
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append("resume", file);

    return api.post("/users/resume", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  appliedJobs: () => api.get("/users/applied-jobs"),
  savedJobs: () => api.get("/users/saved-jobs"),
  saveJob: (jobId) => api.post(`/users/saved-jobs/${jobId}`),
  removeSavedJob: (jobId) => api.delete(`/users/saved-jobs/${jobId}`),
  notificationSummary: () => api.get("/users/notifications/summary"),
  notifications: (params) => api.get("/users/notifications", { params }),
  markNotificationRead: (id) => api.patch(`/users/notifications/${id}/read`),
  markAllNotificationsRead: () => api.patch("/users/notifications/read-all"),
  deleteNotification: (id) => api.delete(`/users/notifications/${id}`),
  sendNotificationDigest: () => api.post("/users/notifications/digest"),
};
