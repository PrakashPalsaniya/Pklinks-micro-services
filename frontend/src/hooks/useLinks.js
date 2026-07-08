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
    // optimistically flip isActive, snapshotting cache for rollback on failure
    onMutate: async (code) => {
      await queryClient.cancelQueries({ queryKey: linkKeys.all });
      await queryClient.cancelQueries({ queryKey: linkKeys.detail(code) });

      const previousAll = queryClient.getQueryData(linkKeys.all);
      const previousDetail = queryClient.getQueryData(linkKeys.detail(code));

      queryClient.setQueryData(linkKeys.all, (current) => {
        if (!Array.isArray(current)) return current;
        return current.map((item) =>
          item.code === code ? { ...item, isActive: false } : item
        );
      });
      queryClient.setQueryData(linkKeys.detail(code), (current) =>
        current ? { ...current, isActive: false } : current
      );

      return { previousAll, previousDetail, code };
    },
    onError: (_err, code, context) => {
      if (context?.previousAll !== undefined) {
        queryClient.setQueryData(linkKeys.all, context.previousAll);
      }
      if (context?.previousDetail !== undefined) {
        queryClient.setQueryData(linkKeys.detail(code), context.previousDetail);
      }
    },
    onSettled: (_data, _err, code) => {
      queryClient.invalidateQueries({ queryKey: linkKeys.analytics(code) });
    }
  });
};

