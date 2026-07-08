import axios from "axios";
import { getAccessToken, setAccessToken } from "./tokenStore";

const baseURL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

let unauthorizedHandler = null;
let refreshPromise = null;

export function getAbsoluteApiBaseUrl() {
  if (/^https?:\/\//i.test(baseURL)) return `${baseURL}/`;
  return new URL(`${baseURL.replace(/^\//, "")}/`, window.location.origin).toString();
}

export function buildRedirectProxyUrl(code) {
  const safe = encodeURIComponent(code || "");

  // hit the backend directly in prod so the SPA router doesn't loop
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase) {
    const rootBase = apiBase.replace(/\/api\/?$/, "").replace(/\/$/, "");
    return `${rootBase}/r/${safe}`;
  }

  // local dev goes through the vite proxy
  return `${window.location.origin}/r/${safe}`;
}

function getErrorMessage(status, message = "") {
  if (message) return message;

  if (status === 404) return "We couldn't find that.";
  if (status === 409) return "That already exists.";
  if (status === 401) return "Session expired. Please login again.";
  if (status === 429) return "Too many requests. Take a breath!";
  if (status >= 500)  return "Our server is having a bad day. Try again soon.";
  return "Something went wrong.";
}

// callback fired when a request stays unauthorized (used to log out)
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
  return () => {
    if (unauthorizedHandler === fn) unauthorizedHandler = null;
  };
}

const client = axios.create({
  baseURL,
  withCredentials: true, // send cookies
});

client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    if (config.headers && typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      if (config.headers) {
        delete config.headers["Authorization"];
        delete config.headers["authorization"];
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
  }
  return config;
});

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

client.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    const originalRequest = err.config;
    const status = err.response?.status;

    const isAuthRoute = originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/auth/signup");

    // try to refresh once on 401
    if (status === 401 && !originalRequest._retry && !isAuthRoute) {
      try {
        await runRefresh();
        originalRequest._retry = true;
        return client(originalRequest);
      } catch (refreshError) {
        if (unauthorizedHandler) unauthorizedHandler();
      }
    }

    const msg = getErrorMessage(status, err.response?.data?.message);
    const customError = new Error(msg);
    customError.status = status;

    return Promise.reject(customError);
  }
);

export default client;
