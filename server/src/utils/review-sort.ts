/**
 * Helpers for the "sort by review status" column in the content-manager list view.
 *
 * `reviewStatus` is not a real attribute of the sorted content type - the status lives in the
 * plugin's own table. It therefore has to be stripped from the query before the content-manager
 * validates it, and the ordering has to be applied further down, once the request has been
 * authenticated and the query has been narrowed down by the user's permissions.
 */

/** Virtual sort key exposed by the list view column. */
export const REVIEW_SORT_FIELD = 'reviewStatus';

/**
 * Key under which the koa layer hands the parsed sort over to the document service middleware.
 * Stored on `ctx.state` so it is scoped to a single request.
 */
export const REVIEW_SORT_STATE_KEY = 'reviewWorkflowSort';

/**
 * Upper bound on the number of documents ordered in memory for one list view request.
 * Ordering by review status requires the full id set, so this caps the blast radius on very
 * large collections. Beyond it, the ordering is applied to the first N documents only.
 */
export const MAX_SORTABLE_DOCUMENTS = 10_000;

export type ReviewSortDirection = 'ASC' | 'DESC';

export type ReviewSortMarker = {
  uid: string;
  direction: ReviewSortDirection;
};

/** Relative order of the review statuses, ascending. Documents without a review sort last. */
const STATUS_ORDER: Record<string, number> = {
  approved: 1,
  pending: 2,
  rejected: 3,
};
const NO_REVIEW_ORDER = 4;

export const getStatusRank = (status: string | null | undefined): number =>
  (status && STATUS_ORDER[status]) || NO_REVIEW_ORDER;

/**
 * Splits a content-manager `sort` query param into the review status direction (if present) and
 * the remaining, schema-valid sort entries. Returns `null` when the query does not sort by review
 * status, in which case the request must be left untouched.
 */
export const parseReviewSort = (
  sort: unknown
): { direction: ReviewSortDirection; rest: string[] } | null => {
  const entries = Array.isArray(sort) ? sort : typeof sort === 'string' ? sort.split(',') : [];

  let direction: ReviewSortDirection | null = null;
  const rest: string[] = [];

  for (const raw of entries) {
    if (typeof raw !== 'string') {
      continue;
    }
    const entry = raw.trim();
    if (!entry) {
      continue;
    }
    const [field, order] = entry.split(':');
    if (field === REVIEW_SORT_FIELD) {
      direction = (order || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    } else {
      rest.push(entry);
    }
  }

  return direction ? { direction, rest } : null;
};

/** Extracts the content type uid from a content-manager collection-types list view path. */
export const getCollectionTypeUid = (path: string): string | null => {
  const match = path.match(/^\/content-manager\/collection-types\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
};
