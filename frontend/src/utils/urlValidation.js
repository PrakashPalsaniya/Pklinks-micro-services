const IPV4_HOST_REGEX = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

const hasSupportedHostnameShape = (hostname) => {
  if (!hostname) {
    return false;
  }

  if (hostname === "localhost") {
    return true;
  }

  if (hostname.includes(":")) {
    return true;
  }

  if (IPV4_HOST_REGEX.test(hostname)) {
    return true;
  }

  return hostname.includes(".");
};

export const isValidHttpUrlInput = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue.startsWith("http://") && !trimmedValue.startsWith("https://")) {
    return false;
  }

  try {
    const parsed = new URL(trimmedValue);
    return ["http:", "https:"].includes(parsed.protocol) && hasSupportedHostnameShape(parsed.hostname);
  } catch (_error) {
    return false;
  }
};
