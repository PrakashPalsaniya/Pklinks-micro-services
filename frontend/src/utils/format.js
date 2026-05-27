import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";

const parseValue = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = parseISO(String(value));
  return isValid(parsed) ? parsed : null;
};

const formatTitleToken = (value) => value
  .replace(/[-_]+/g, " ")
  .replace(/\s+/g, " ")
  .trim()
  .split(" ")
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(" ");

export const formatShortDate = (value) => {
  const parsed = parseValue(value);
  return parsed ? format(parsed, "MMM d") : "-";
};

export const formatDateTime = (value) => {
  const parsed = parseValue(value);
  return parsed ? format(parsed, "MMM d, yyyy 'at' h:mm a") : "-";
};

export const formatRelativeDate = (value) => {
  const parsed = parseValue(value);
  return parsed ? `${formatDistanceToNowStrict(parsed, { addSuffix: true })}` : "Never";
};

export const formatInputDateTime = (value) => {
  const parsed = parseValue(value);
  return parsed ? format(parsed, "yyyy-MM-dd'T'HH:mm") : "";
};

export const formatCount = (value) => Intl.NumberFormat("en-US").format(value || 0);

export const truncateMiddle = (value, start = 20, end = 12) => {
  if (!value || value.length <= start + end + 3) {
    return value || "";
  }

  return `${value.slice(0, start)}...${value.slice(-end)}`;
};

export const getUrlHostname = (value) => {
  if (!value) {
    return "";
  }

  try {
    return new URL(String(value)).hostname.replace(/^www\./, "");
  } catch (_error) {
    return "";
  }
};

export const getUrlDisplayName = (value) => {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(String(value));
    const hostParts = url.hostname.replace(/^www\./, "").split(".").filter(Boolean);
    const withoutTld = hostParts.length > 1 ? hostParts.slice(0, -1) : hostParts;
    const titleFromHost = formatTitleToken(withoutTld.join(" "));

    if (titleFromHost) {
      return titleFromHost;
    }

    const firstPathSegment = url.pathname.split("/").filter(Boolean)[0] || "";
    return formatTitleToken(firstPathSegment) || getUrlHostname(value);
  } catch (_error) {
    return "";
  }
};

export const getUrlMonogram = (value) => {
  const hostname = getUrlHostname(value);

  if (!hostname) {
    return "PK";
  }

  const letters = hostname
    .split(/[.-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase())
    .join("");

  return letters || hostname.slice(0, 2).toUpperCase();
};

export const getFaviconUrl = (value) => {
  const hostname = getUrlHostname(value);
  return hostname ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128` : "";
};

export const toPercentage = (value, total) => {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
};
