import client from "./client";
import { decorateLink } from "../utils/shortUrl";

export async function fetchLinks() {
  const data = await client.get("/links");
  const links = data.links || [];
  return links.map(decorateLink);
}

export async function fetchLink(code) {
  const data = await client.get(`/links/${code}`);
  return decorateLink(data.link || data);
}

export async function createLink(formData) {
  const body = {
    ...formData,
    originalUrl: formData.longUrl,
    expiresAt: formData.expiry ? new Date(formData.expiry).toISOString() : null
  };

  const data = await client.post("/links", body);
  return decorateLink(data.link || data);
}

export async function updateLink({ code, payload }) {
  // only send changed fields so we don't wipe others
  const { longUrl, expiry, ...rest } = payload;
  const body = { ...rest };

  if (longUrl !== undefined) body.originalUrl = longUrl;
  if ("expiry" in payload) {
    body.expiresAt = expiry ? new Date(expiry).toISOString() : null;
  }

  const data = await client.patch(`/links/${code}`, body);
  return decorateLink(data.link || data);
}

export async function deactivateLink(code) {
  return client.delete(`/links/${code}`);
}
