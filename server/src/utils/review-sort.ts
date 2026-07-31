/**
 * Helpers for the "sort by review status" column
 *
 * `reviewStatus` is a custom value and this status is stored in the
 * plugin's table. It has to be stripped from the query before the content-manager
 * validates it, and the ordering has to be done once the request has been
 * authenticated and validated against the user's permissions.
 */

export const REVIEW_SORT_FIELD = "reviewStatus";
export const REVIEW_SORT_STATE_KEY = "reviewWorkflowSort";
export const REVIEW_SORT_GUARD_KEY = "reviewWorkflowSortInternal";

// TODO: Can we remove this limit?
export const MAX_SORTABLE_DOCUMENTS = 10_000;

export type ReviewSortDirection = "ASC" | "DESC";

export type ReviewSortMarker = {
  uid: string;
  direction: ReviewSortDirection;
  applied?: boolean;
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

const STABLE_SORT_FIELD = "documentId";

const hasStableSortField = (sort: unknown): boolean => {
  if (typeof sort === "string") {
    return sort.split(",").some((entry) => entry.trim().split(":")[0] === STABLE_SORT_FIELD);
  }
  if (Array.isArray(sort)) {
    return sort.some((entry) => hasStableSortField(entry));
  }
  if (sort && typeof sort === "object") {
    return STABLE_SORT_FIELD in (sort as Record<string, unknown>);
  }
  return false;
};

export const withStableSort = (sort: unknown): unknown => {
  if (hasStableSortField(sort)) {
    return sort;
  }

  const entry = `${STABLE_SORT_FIELD}:asc`;

  if (sort === undefined || sort === null || sort === "") {
    return entry;
  }
  if (typeof sort === "string") {
    return `${sort},${entry}`;
  }
  if (Array.isArray(sort)) {
    if (sort.length === 0) {
      return entry;
    }
    if (sort.every((value) => typeof value === "string")) {
      return [...sort, entry];
    }
    if (sort.every((value) => value && typeof value === "object")) {
      return [...sort, { [STABLE_SORT_FIELD]: "asc" }];
    }

    return sort;
  }
  if (typeof sort === "object") {
    return [sort, { [STABLE_SORT_FIELD]: "asc" }];
  }

  return sort;
};

/** Extracts the content type uid from a content-manager collection-types list view path */
export const getCollectionTypeUid = (path: string): string | null => {
  const match = path.match(/^\/content-manager\/collection-types\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
};
