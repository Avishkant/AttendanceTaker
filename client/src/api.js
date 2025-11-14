import axios from "axios";

let baseURL = import.meta.env.VITE_API_BASE_URL;
if (baseURL) {
  if (!baseURL.endsWith("/api")) {
    baseURL = baseURL.replace(/\/$/, "") + "/api";
  }
} else {
  console.warn(
    "VITE_API_BASE_URL is not set. Falling back to relative '/api'. Set VITE_API_BASE_URL for cross-origin deployments."
  );
  baseURL = "/api";
}

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const deviceId = localStorage.getItem("deviceId");
  if (deviceId) config.headers["x-device-id"] = deviceId;
  return config;
});

export default api;
