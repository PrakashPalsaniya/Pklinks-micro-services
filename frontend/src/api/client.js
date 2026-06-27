import axios from "axios";
import { getAccessToken, setAccessToken } from "./tokenStore";

const baseURL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

let unauthorizedHandler = null;
let refreshPromise = null;

// Build absolute API URL for OAuth redirects
export function getAbsoluteApiBaseUrl() {
  if (/^https?:\/\//i.test(baseURL)) return `${baseURL}/`;
  return new URL(`${baseURL.replace(/^\//, "")}/`, window.location.origin).toString();
}

// Build proxy redirect URL
export function buildRedirectProxyUrl(code) {
  const safe = encodeURIComponent(code || "");
  
  // Point directly to the backend in production to avoid React Router looping on Vercel
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase) {
    const rootBase = apiBase.replace(/\/api\/?$/, "").replace(/\/$/, "");
    return `${rootBase}/r/${safe}`;
  }

  // Fallback for local development (relies on Vite proxy)
  return `${window.location.origin}/r/${safe}`;
}

// Map HTTP status codes to user-friendly messages
function getErrorMessage(status, message = "") {
  if (message) return message; // Prioritize specific messages from the backend

  if (status === 404) return "We couldn't find that.";
  if (status === 409) return "That already exists.";
  if (status === 401) return "Session expired. Please login again.";
  if (status === 429) return "Too many requests. Take a breath!";
  if (status >= 500)  return "Our server is having a bad day. Try again soon.";
  return "Something went wrong.";
}

// Register a global callback to handle unauthorized access (e.g., logging out)
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
  return () => {
    if (unauthorizedHandler === fn) unauthorizedHandler = null;
  };
}

const client = axios.create({
  baseURL,
  withCredentials: true, // important for cookies
});

// Attach access token to every request
client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Silently refresh the access token in the background
async function runRefresh() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = client.post("/auth/refresh", {}, { 
    _retry: true, 
    skipAuth: true 
  }).then(res => {
    if (res.accessToken) setAccessToken(res.accessToken);
    return res;
  }).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

// Handle all responses and errors
client.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    const originalRequest = err.config;
    const status = err.response?.status;

    const isAuthRoute = originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/auth/signup");

    // 1. Handle Token Refresh (401)
    if (status === 401 && !originalRequest._retry && !isAuthRoute) {
      try {
        await runRefresh();
        originalRequest._retry = true;
        return client(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout the user
        if (unauthorizedHandler) unauthorizedHandler();
      }
    }

    // 2. Format Error Message
    const msg = getErrorMessage(status, err.response?.data?.message);
    const customError = new Error(msg);
    customError.status = status;

    return Promise.reject(customError);
  }
);

export default client;
