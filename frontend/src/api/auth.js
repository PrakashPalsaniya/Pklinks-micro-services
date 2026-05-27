import client from "./client";

// POST /auth/signup
export async function signupWithEmail(data) {
  return client.post("/auth/signup", data);
}

// POST /auth/login
export async function loginWithEmail(data) {
  return client.post("/auth/login", data);
}

// POST /auth/refresh 
// Browser sends the Refresh Token cookie automatically
export async function refreshSession() {
  return client.post("/auth/refresh", {}, { _retry: true });
}

// POST /auth/logout
export async function logoutSession() {
  return client.post("/auth/logout", {});
}

// GET /auth/me
export async function fetchCurrentUser() {
  return client.get("/auth/me");
}

