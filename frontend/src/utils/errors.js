export function getDisplayErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  // prefer the backend's message
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.status) {
    switch (error.response.status) {
      case 429:
        return "Too many requests. Please take a breath and try again in a moment.";
      case 404:
        return "We couldn't find what you were looking for.";
      case 403:
        return "You don't have permission to perform this action.";
      case 401:
        return "Please log in to continue.";
      case 500:
      case 502:
      case 503:
      case 504:
        return "Our servers are currently experiencing issues. Please try again later.";
      default:
        break;
    }
  }

  // hide axios's default status-code message
  if (error.message && error.message.includes("Request failed with status code")) {
    return fallback;
  }

  if (typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
