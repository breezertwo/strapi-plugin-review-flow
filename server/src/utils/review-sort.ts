/**
 * Helpers for the "sort by review status" column
 *
 * `reviewStatus` is not a real attribute of the sorted content type - the status is stored in the
 * plugin's own table. It has to be stripped from the query before the content-manager
 * validates it, and the ordering has to be done once the request has been
 * authenticated and validated against the user's permissions.
 */

export const REVIEW_SORT_FIELD = "reviewStatus";
export const REVIEW_SORT_STATE_KEY = "reviewWorkflowSort";

// TODO: Can we remove this limit?
export const MAX_SORTABLE_DOCUMENTS = 10_000;

export type ReviewSortDirection = "ASC" | "DESC";

export type ReviewSortMarker = {
  uid: string;
  direction: ReviewSortDirection;
};

const STATUS_ORDER: Record<string, number> = {
  approved: 1,
  pending: 2,
  rejected: 3,
};
const NO_REVIEW_ORDER = 4;

export const getStatusRank = (status: string | null | undefined): number =>
  (status && STATUS_ORDER[status]) || NO_REVIEW_ORDER;

/**
 * Splits a content-manager `sort` query param into the review status (if present) and
 * the schema-valid sort entries. `null` if no review status sort is active.
 */
export const parseReviewSort = (
  sort: unknown,
): { direction: ReviewSortDirection; rest: string[] } | null => {
  const entries = Array.isArray(sort) ? sort : typeof sort === "string" ? sort.split(",") : [];

  let direction: ReviewSortDirection | null = null;
  const rest: string[] = [];

  for (const raw of entries) {
    if (typeof raw !== "string") {
      continue;
    }
    const entry = raw.trim();
    if (!entry) {
      continue;
    }
    const [field, order] = entry.split(":");
    if (field === REVIEW_SORT_FIELD) {
      direction = (order || "ASC").toUpperCase() === "DESC" ? "DESC" : "ASC";
    } else {
      rest.push(entry);
    }
  }

  return direction ? { direction, rest } : null;
};

/** Extracts the content type uid from a content-manager collection-types list view path */
export const getCollectionTypeUid = (path: string): string | null => {
  const match = path.match(/^\/content-manager\/collection-types\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
};
