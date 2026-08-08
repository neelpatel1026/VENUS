import axios from "axios";

// Determine the API URL base path
const getBaseURL = () => {
  if (import.meta.env.MODE === "production") {
    // Return custom backend domain or '/' in production (if served under same host)
    return import.meta.env.VITE_API_URL || "/api";
  }
  return "/api";
};

// Create reusable Axios instance with timeouts
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000, // 10000ms timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to automatically pass CSRF protection headers if present
api.interceptors.request.use(
  (config) => {
    const csrfToken = window._csrfToken;
    if (csrfToken && ["post", "put", "delete", "patch"].includes(config.method?.toLowerCase())) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to perform auto-retries up to 2 times on network/server failures
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // If config does not exist or retry count is not specified/exceeded, reject
    if (!config || !config.retry) {
      config.retry = 2; // Default to 2 retries
      config.retryCount = 0;
    }

    if (config.retryCount >= config.retry) {
      return Promise.reject(error);
    }

    // Exclude certain statuses from retrying (like 400, 401, 403, 404, 429)
    if (error.response && [400, 401, 403, 404, 429].includes(error.response.status)) {
      return Promise.reject(error);
    }

    config.retryCount += 1;
    
    // Add dynamic delay between retries
    const delay = config.retryCount * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));
    
    // Re-execute request
    return api(config);
  }
);

export default api;
