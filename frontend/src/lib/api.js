import axios from "axios";

const getBaseURL = () => {
  // Always log VITE_API_URL context to help track down connectivity delays in production
  console.log("VITE_API_URL resolved in browser runtime:", import.meta.env.VITE_API_URL);
  return import.meta.env.VITE_API_URL || "/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    if (!config.retry) {
      config.retry = 2;
      config.retryCount = 0;
    }

    if (config.retryCount >= config.retry) {
      return Promise.reject(error);
    }

    if (error.response && [400, 401, 403, 404, 429].includes(error.response.status)) {
      return Promise.reject(error);
    }

    config.retryCount += 1;
    const delay = config.retryCount * 1500; // Delay retry once after 1.5 seconds, then 3 seconds
    await new Promise((resolve) => setTimeout(resolve, delay));
    return api(config);
  }
);

export default api;
