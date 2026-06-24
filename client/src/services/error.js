export const getErrorMessage = (error, fallback = "Something went wrong") => {
  if (error?.code === "ERR_NETWORK" || !error?.response) {
    return "Cannot reach the backend API. Start the server or set VITE_API_BASE_URL.";
  }

  return error?.response?.data?.message || error?.message || fallback;
};
