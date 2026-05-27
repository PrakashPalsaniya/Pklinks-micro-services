import { useQuery } from "@tanstack/react-query";
import { fetchLinkAnalytics } from "../api/analytics";
import { linkKeys } from "./useLinks";

export const useLinkAnalyticsQuery = (code) => useQuery({
  queryKey: linkKeys.analytics(code),
  queryFn: () => fetchLinkAnalytics(code),
  enabled: Boolean(code)
});