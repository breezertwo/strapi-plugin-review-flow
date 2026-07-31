export type ApprovalBlockReason =
  | "REVIEW_NOT_FOUND"
  | "REVIEWER_MISSING"
  | "NOT_ASSIGNED_REVIEWER"
  | "SELF_APPROVAL"
  | "NOT_PENDING";

export const APPROVAL_BLOCK_MESSAGES: Record<ApprovalBlockReason, string> = {
  REVIEW_NOT_FOUND: "Review not found",
  REVIEWER_MISSING:
    "The assigned reviewer no longer exists. Cancel this review request to unblock the document.",
  NOT_ASSIGNED_REVIEWER: "Only the assigned reviewer can approve this review",
  SELF_APPROVAL: "You cannot approve a review you requested yourself",
  NOT_PENDING: "Only pending reviews can be approved",
};
