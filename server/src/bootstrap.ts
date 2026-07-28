import type { Core, UID } from '@strapi/strapi';
import { resolveLocale } from './utils/locale';
import {
  getCollectionTypeUid,
  getStatusRank,
  parseReviewSort,
  MAX_SORTABLE_DOCUMENTS,
  REVIEW_SORT_STATE_KEY,
  type ReviewSortMarker,
} from './utils/review-sort';

// Custom error class for review workflow errors
class ReviewWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReviewWorkflowError';
  }
}

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  // Determine which content types the plugin should apply to
  const configuredContentTypes: string[] =
    strapi.plugin('review-workflow').config('contentTypes') || [];

  const allContentTypes = Object.keys(strapi.contentTypes) as UID.ContentType[];
  const enabledContentTypes = allContentTypes.filter((uid) => {
    const contentType = strapi.contentType(uid);
    if (!contentType?.options?.draftAndPublish || !uid.startsWith('api::')) {
      return false;
    }
    if (configuredContentTypes.length > 0) {
      return configuredContentTypes.includes(uid);
    }
    return true;
  });

  const enabledSet = new Set<string>(enabledContentTypes);

  // koa error-handling middleware to catch ReviewWorkflowError and transform to proper error message
  strapi.server.use(async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      if (error instanceof ReviewWorkflowError) {
        ctx.status = 422;
        ctx.body = {
          data: null,
          error: {
            message: error.message,
          },
        };
        return;
      }
      throw error;
    }
  });

  // Sorting the content-manager list view by review status happens in two steps.
  //
  // 1. A koa middleware rewrites the incoming query. `reviewStatus` is not an attribute of the
  //    sorted content type, so the content-manager's query validation would reject it. This
  //    middleware only ever rewrites the request and always calls `next()` - it never reads data
  //    and never produces a response, so it runs safely before authentication.
  strapi.server.use(async (ctx, next) => {
    if (ctx.method !== 'GET') {
      return next();
    }

    const uid = getCollectionTypeUid(ctx.path);
    if (!uid) {
      return next();
    }

    const parsed = parseReviewSort(ctx.query.sort);
    if (!parsed) {
      return next();
    }

    // Strip the virtual sort key so the content-manager only ever sees real attributes.
    if (parsed.rest.length === 0) {
      delete ctx.query.sort;
    } else {
      ctx.query.sort = Array.isArray(ctx.query.sort) ? parsed.rest : parsed.rest.join(',');
    }

    // Hand the ordering over to the document service middleware below, which runs once the
    // request has been authenticated and authorized.
    if (enabledSet.has(uid)) {
      const marker: ReviewSortMarker = { uid, direction: parsed.direction };
      ctx.state[REVIEW_SORT_STATE_KEY] = marker;
    }

    return next();
  });

  // 2. A document service middleware applies the ordering. It runs inside the content-manager
  //    controller, which means authentication, RBAC and the user's permission conditions have
  //    already been applied - `context.params` is the sanitized query. Only the page of results
  //    is replaced; the surrounding `findPage` still derives the pagination meta from the
  //    untouched params and its own `count`, and still sanitizes the output.
  strapi.documents.use(async (context, next) => {
    if (context.action !== 'findMany') {
      return next();
    }

    const requestCtx = strapi.requestContext.get();
    const marker = requestCtx?.state?.[REVIEW_SORT_STATE_KEY] as ReviewSortMarker | undefined;

    if (!marker || marker.uid !== context.uid) {
      return next();
    }

    // Consume the marker: the lean id query below goes through the document service as well and
    // must not re-enter this middleware.
    delete requestCtx.state[REVIEW_SORT_STATE_KEY];

    const params = (context.params ?? {}) as Record<string, any>;
    const { page, pageSize, start, limit, populate, fields, ...rest } = params;

    const pageNumber = Number(page) > 0 ? Number(page) : 1;
    const size = Number(pageSize) > 0 ? Number(pageSize) : 10;
    const offset = start !== undefined ? Number(start) || 0 : (pageNumber - 1) * size;
    const take = limit !== undefined ? Number(limit) || size : size;

    try {
      const locale = await resolveLocale(strapi, rest.locale);

      // Fetch the ids of every document the caller is allowed to see. `rest` still carries the
      // sanitized filters, locale and status, so this never widens the result set. `sort` is kept
      // so the secondary ordering is preserved within each status bucket.
      const allDocuments = await strapi.documents(context.uid as UID.ContentType).findMany({
        ...rest,
        fields: ['documentId'],
        limit: MAX_SORTABLE_DOCUMENTS + 1,
      } as any);

      let documentIds = allDocuments.map((doc: any) => doc.documentId);

      if (documentIds.length > MAX_SORTABLE_DOCUMENTS) {
        documentIds = documentIds.slice(0, MAX_SORTABLE_DOCUMENTS);
        strapi.log.warn(
          `Review workflow: ${context.uid} has more than ${MAX_SORTABLE_DOCUMENTS} matching documents. ` +
            `Sorting by review status is applied to the first ${MAX_SORTABLE_DOCUMENTS} only.`
        );
      }

      if (documentIds.length === 0) {
        return [];
      }

      const statusMap = await strapi
        .plugin('review-workflow')
        .service('review-workflow')
        .getReviewStatusesForDocuments(context.uid, documentIds, locale);

      // Array.prototype.sort is stable, so documents sharing a status keep the secondary order.
      const sortedIds = [...documentIds].sort((a, b) => {
        const rankA = getStatusRank(statusMap.get(a));
        const rankB = getStatusRank(statusMap.get(b));
        return marker.direction === 'ASC' ? rankA - rankB : rankB - rankA;
      });

      const pageIds = sortedIds.slice(offset, offset + take);
      if (pageIds.length === 0) {
        return [];
      }

      // Re-run the original query, narrowed down to the current page.
      context.params = {
        ...rest,
        populate,
        fields,
        filters: rest.filters
          ? { $and: [rest.filters, { documentId: { $in: pageIds } }] }
          : { documentId: { $in: pageIds } },
        limit: pageIds.length,
      };

      const results = await next();

      if (!Array.isArray(results)) {
        return results;
      }

      const byDocumentId = new Map(results.map((doc: any) => [doc.documentId, doc]));
      return pageIds.map((id) => byDocumentId.get(id)).filter(Boolean);
    } catch (error) {
      strapi.log.error('Review workflow: Error sorting by review status', error);
      // Fall back to the unordered page rather than failing the request.
      context.params = params;
      return next();
    }
  });

  // Register lifecycle hooks for enabled content types
  for (const uid of enabledContentTypes) {
    strapi.log.debug(`Review workflow: Registering lifecycle hooks for ${uid}`);

    strapi.documents.use(async (context, next) => {
      if (context.uid !== uid) {
        return next();
      }

      // Check if this is a publish action
      const isPublishAction = context.action === 'publish';

      if (!isPublishAction) {
        return next();
      }

      const documentId = context.params?.documentId;
      const locale = await resolveLocale(
        strapi,
        context.params?.locale as string | null | undefined
      );

      if (!documentId) {
        return next();
      }

      strapi.log.debug(
        `Review workflow: Checking publish permission for ${uid} document ${documentId} locale ${locale}`
      );

      const ctx = strapi.requestContext.get();
      const user = ctx?.state?.user;

      if (user) {
        try {
          const permissions = await strapi.admin.services.permission.findUserPermissions(user);
          const hasPublishWithoutReviewPermission = permissions.some(
            (permission: { action: string }) =>
              permission.action === 'plugin::review-workflow.review.publish-without-review'
          );

          if (hasPublishWithoutReviewPermission) {
            strapi.log.debug(
              `Review workflow: User has "Publish Without Review" permission, skipping review check for ${uid} document ${documentId} locale ${locale}`
            );
            return next();
          }
        } catch (error) {
          strapi.log.error('Review workflow: Error checking user permissions', error);
        }
      }

      // Check if there's an approved review for this document and locale
      const permissionService = strapi.plugin('review-workflow').service('permission');
      const blockReason = await permissionService.getPublishBlockReason(uid, documentId, locale);

      if (blockReason !== null) {
        throw new ReviewWorkflowError(permissionService.getBlockReasonMessage(blockReason));
      }

      strapi.log.debug(
        `Review workflow: Publish approved for ${uid} document ${documentId} locale ${locale}`
      );

      return next();
    });
  }

  strapi.log.info('Review workflow plugin initialized');
};
