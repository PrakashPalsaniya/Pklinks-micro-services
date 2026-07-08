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

// map backend field names to what the UI expects, keeping originals too
export const decorateLink = (link) => {
  if (!link) return link;

  return {
    ...link,
    longUrl: link.longUrl || link.originalUrl || "",
    expiry: link.expiry || link.expiresAt || null,
    clickCount: link.clickCount ?? link.clicks ?? 0,
    id: link.id || link._id || "",
    shortUrl: buildShortUrl(link.code),
  };
};
