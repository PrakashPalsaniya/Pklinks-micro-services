export const deriveLinkStatus = (link) => {
  if (!link) {
    return "inactive";
  }

  if (link.expiry && new Date(link.expiry).getTime() < Date.now()) {
    return "expired";
  }

  if (!link.isActive) {
    return "inactive";
  }

  return "active";
};

export const getStatusMeta = (status) => {
  switch (status) {
    case "active":
      return {
        label: "Active",
        className: "border-accent/20 bg-accentDim text-accentText"
      };
    case "expired":
      return {
        label: "Expired",
        className: "border-warning/20 bg-warningDim text-warningText"
      };
    default:
      return {
        label: "Inactive",
        className: "border-borderDefault bg-elevated text-secondary"
      };
  }
};

export const paginate = (items, page, pageSize) => {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
};
