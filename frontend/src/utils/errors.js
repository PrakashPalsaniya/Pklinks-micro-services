export function getDisplayErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) {
    return fallback;
  }

  // If it's a string, return it directly
  if (typeof error === "string") {
    return error;
  }

  // 1. Prioritize the custom message sent from our backend API
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // 2. Map common HTTP status codes to user-friendly messages
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
        break; // Fall through
    }
  }

  // 3. Prevent Axios's default "Request failed with status code XXX"
  if (error.message && error.message.includes("Request failed with status code")) {
    return fallback;
  }

  // 4. Return any other safe error message (like "Network Error")
  if (typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
