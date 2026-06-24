export const getErrorMessage = (error, fallback = "Something went wrong") => {
  if (error?.code === "ERR_NETWORK" || !error?.response) {
    return import.meta.env.PROD
      ? "Cannot reach the backend API. Check the Render deployment or configure VITE_API_BASE_URL."
      : "Cannot reach the backend API. Start the server or set VITE_API_BASE_URL.";
  }

  return error?.response?.data?.message || error?.message || fallback;
};
