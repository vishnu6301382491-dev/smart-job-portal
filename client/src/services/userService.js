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
};

