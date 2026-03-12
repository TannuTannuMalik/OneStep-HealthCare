import axios from "axios";

// Use environment variable first, otherwise default to Railway backend
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://onestep-healthcare-production.up.railway.app/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
