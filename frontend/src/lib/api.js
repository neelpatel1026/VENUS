import axios from "axios";

// Resolve API base URL dynamically based on environment
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // In development, default to local Express backend server
  return "http://localhost:5000";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000, // 15s timeout to account for cold starts
  withCredentials: true,
});

export default api;
