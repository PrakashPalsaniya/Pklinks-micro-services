// Access token kept in memory only. The refresh token is an httpOnly
// cookie set by the server and is never readable from JS.
let accessToken = "";

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token || "";
}

export function clearAllTokens() {
  accessToken = "";
}
