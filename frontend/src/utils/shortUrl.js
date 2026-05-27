// src/utils/shortUrl.js
// Utilities for building short URLs and normalising link objects from the backend.
//
// Backend field names → Frontend field names:
//   originalUrl  →  longUrl        (dashboard/pages use link.longUrl)
//   expiresAt    →  expiry         (status.js uses link.expiry)
//   _id          →  id             (convenience alias)
//
// We keep original fields too so nothing breaks if code reads either name.

const normalizeBase = (value = "") => value.replace(/\/$/, "").replace(/\/r$/, "");

export const getShortUrlBase = () => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return normalizeBase(window.location.origin);
  }
  return "";
};

export const buildShortUrl = (code) => {
  const normalizedCode = typeof code === "string" ? code.trim() : "";
  if (!normalizedCode) return "";
  const base = getShortUrlBase();
  return base ? `${base}/r/${normalizedCode}` : `/r/${normalizedCode}`;
};

/**
 * Normalise a raw link object from the backend.
 * Adds computed fields and maps backend field names to the names the UI expects.
 */
export const decorateLink = (link) => {
  if (!link) return link;

  return {
    // Keep all original fields (don't lose anything)
    ...link,

    // ── Field aliases ──────────────────────────────────────────────────────
    // Backend: originalUrl  → Frontend: longUrl
    longUrl: link.longUrl || link.originalUrl || "",

    // Backend: expiresAt    → Frontend: expiry
    expiry: link.expiry || link.expiresAt || null,

    // Backend: clicks       → Frontend: clickCount
    clickCount: link.clickCount ?? link.clicks ?? 0,

    // Convenience id alias
    id: link.id || link._id || "",

    // ── Computed ───────────────────────────────────────────────────────────
    shortUrl: buildShortUrl(link.code),
  };
};
