import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;
if (!baseURL)
  console.warn(
    "VITE_API_BASE_URL is not set. Set it in client/.env to your backend API base URL."
  );

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
