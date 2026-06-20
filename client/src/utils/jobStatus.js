export const JOB_STATUSES = ["draft", "open", "closed"];

const statusLabels = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
};

const statusVariants = {
  draft: "neutral",
  open: "success",
  closed: "warning",
};

export const getJobStatusLabel = (status) => statusLabels[status] || "Draft";

export const getJobStatusVariant = (status) => statusVariants[status] || "neutral";

export const getJobStatusMeta = (status) => ({
  label: getJobStatusLabel(status),
  variant: getJobStatusVariant(status),
});
