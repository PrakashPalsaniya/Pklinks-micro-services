let accessToken = "";

// Simple in-memory store for the JWT Access Token.
// The Refresh Token is handled automatically by the browser via cookies.

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token || "";
}

export function clearAccessToken() {
  accessToken = "";
}

// Just a helper to clear everything we know about
export function clearAllTokens() {
  accessToken = "";
}

// These are placeholders for the old cookie logic 
// (not needed anymore, but kept to prevent breakages)
export function getRefreshToken() { return ""; }
export function setRefreshToken() { }