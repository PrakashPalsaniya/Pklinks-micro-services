import client from "./client";
import { decorateLink } from "../utils/shortUrl";

// GET /links  →  list of links for the user
export async function fetchLinks() {
  const data = await client.get("/links");
  const links = data.links || [];
  return links.map(decorateLink);
}

// GET /links/:code  →  single link details
export async function fetchLink(code) {
  const data = await client.get(`/links/${code}`);
  return decorateLink(data.link || data);
}

// POST /links  →  create a new short link
export async function createLink(formData) {
  // convert frontend names (longUrl, expiry) to backend names
  const body = {
    ...formData,
    originalUrl: formData.longUrl,
    expiresAt: formData.expiry
  };

  const data = await client.post("/links", body);
  return decorateLink(data.link || data);
}

// PATCH /links/:code  →  update an existing link
export async function updateLink({ code, payload }) {
  const body = {
    ...payload,
    originalUrl: payload.longUrl,
    expiresAt: payload.expiry
  };

  const data = await client.patch(`/links/${code}`, body);
  return decorateLink(data.link || data);
}

// DELETE /links/:code  →  disable a link
export async function deactivateLink(code) {
  return client.delete(`/links/${code}`);
}
