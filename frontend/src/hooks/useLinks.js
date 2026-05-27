import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLink,
  deactivateLink,
  fetchLink,
  fetchLinks,
  updateLink
} from "../api/links";

export const linkKeys = {
  all: ["links"],
  detail: (code) => ["links", code],
  analytics: (code) => ["links", code, "analytics"]
};

const upsertIntoCollection = (collection, nextLink) => {
  if (!Array.isArray(collection)) {
    return [nextLink];
  }

  const index = collection.findIndex((item) => item.code === nextLink.code);

  if (index === -1) {
    return [nextLink, ...collection];
  }

  return collection.map((item) => (item.code === nextLink.code ? nextLink : item));
};

export const useLinksQuery = () => useQuery({
  queryKey: linkKeys.all,
  queryFn: fetchLinks
});

export const useLinkQuery = (code) => useQuery({
  queryKey: linkKeys.detail(code),
  queryFn: () => fetchLink(code),
  enabled: Boolean(code)
});

export const useCreateLinkMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLink,
    onSuccess: (data) => {
      queryClient.setQueryData(linkKeys.all, (current) => upsertIntoCollection(current, data));
      queryClient.setQueryData(linkKeys.detail(data.code), data);
    }
  });
};

export const useUpdateLinkMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLink,
    onSuccess: (data) => {
      queryClient.setQueryData(linkKeys.all, (current) => upsertIntoCollection(current, data));
      queryClient.setQueryData(linkKeys.detail(data.code), data);
      queryClient.invalidateQueries({ queryKey: linkKeys.analytics(data.code) });
    }
  });
};

export const useDeactivateLinkMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateLink,
    // onSuccess receives the server response ({ message: "..." }) and the variables (code string).
    // Since the delete endpoint doesn't return the link, we update the cache manually using the code.
    onSuccess: (_data, code) => {
      queryClient.setQueryData(linkKeys.all, (current) => {
        if (!Array.isArray(current)) return current;
        return current.map((item) =>
          item.code === code ? { ...item, isActive: false } : item
        );
      });
      queryClient.setQueryData(linkKeys.detail(code), (current) =>
        current ? { ...current, isActive: false } : current
      );
      queryClient.invalidateQueries({ queryKey: linkKeys.analytics(code) });
    }
  });
};

