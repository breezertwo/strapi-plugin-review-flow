import type { Core, UID } from "@strapi/strapi";
import { resolveLocale } from "./utils/locale";
import { getEnabledContentTypes } from "./utils/content-types";
import {
  getCollectionTypeUid,
  getStatusRank,
  parseReviewSort,
  MAX_SORTABLE_DOCUMENTS,
  REVIEW_SORT_STATE_KEY,
  type ReviewSortMarker,
} from "./utils/review-sort";

class ReviewWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReviewWorkflowError";
  }
}

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  const enabledContentTypes = getEnabledContentTypes(strapi);
  const enabledSet = new Set<string>(enabledContentTypes);

  // koa error-handling middleware
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

  // koa middleware rewrites the incoming query
  strapi.server.use(async (ctx, next) => {
    if (ctx.method !== "GET") {
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

    // Strip the virtual sort key so content-manager only sees real attributes
    if (parsed.rest.length === 0) {
      delete ctx.query.sort;
    } else {
      ctx.query.sort = Array.isArray(ctx.query.sort) ? parsed.rest : parsed.rest.join(",");
    }

    // Hand over to the document service middleware, which runs once the request has been authenticated
    if (enabledSet.has(uid)) {
      const marker: ReviewSortMarker = { uid, direction: parsed.direction };
      ctx.state[REVIEW_SORT_STATE_KEY] = marker;
    }

    return next();
  });

  // document service middleware applies ordering. runs inside the content-manager controller:
  // authentication, RBAC and user permissions applied
  strapi.documents.use(async (context, next) => {
    if (context.action !== "findMany") {
      return next();
    }

    const requestCtx = strapi.requestContext.get();
    const marker = requestCtx?.state?.[REVIEW_SORT_STATE_KEY] as ReviewSortMarker | undefined;

    if (!marker || marker.uid !== context.uid) {
      return next();
    }

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
      // sanitized filters, locale and status
      const allDocuments = await strapi.documents(context.uid as UID.ContentType).findMany({
        ...rest,
        fields: ["documentId"],
        limit: MAX_SORTABLE_DOCUMENTS + 1,
      } as any);

      let documentIds = allDocuments.map((doc: any) => doc.documentId);

      if (documentIds.length > MAX_SORTABLE_DOCUMENTS) {
        documentIds = documentIds.slice(0, MAX_SORTABLE_DOCUMENTS);
        strapi.log.warn(
          `Review workflow: ${context.uid} has more than ${MAX_SORTABLE_DOCUMENTS} matching documents. ` +
            `Sorting by review status is applied to the first ${MAX_SORTABLE_DOCUMENTS} only.`,
        );
      }

      if (documentIds.length === 0) {
        return [];
      }

      const statusMap = await strapi
        .plugin("review-workflow")
        .service("review-workflow")
        .getReviewStatusesForDocuments(context.uid, documentIds, locale);

      const sortedIds = [...documentIds].sort((a, b) => {
        const rankA = getStatusRank(statusMap.get(a));
        const rankB = getStatusRank(statusMap.get(b));
        return marker.direction === "ASC" ? rankA - rankB : rankB - rankA;
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
      strapi.log.error("Review workflow: Error sorting by review status", error);

      // Fall back to the unordered page rather than failing the request.
      context.params = params;
      return next();
    }
  });

  strapi.log.debug(
    `Review workflow: Publish gate active for ${enabledContentTypes.length} content type(s)`,
  );

  // publish gate
  strapi.documents.use(async (context, next) => {
    if (context.action !== "publish" || !enabledSet.has(context.uid)) {
      return next();
    }

    const uid = context.uid;
    const documentId = context.params?.documentId;

    if (!documentId) {
      return next();
    }

    const locale = await resolveLocale(strapi, context.params?.locale as string | null | undefined);

    strapi.log.debug(
      `Review workflow: Checking publish permission for ${uid} document ${documentId} locale ${locale}`,
    );

    const ctx = strapi.requestContext.get();
    const user = ctx?.state?.user;

    if (user) {
      try {
        const permissions = await strapi.admin.services.permission.findUserPermissions(user);
        const hasPublishWithoutReviewPermission = permissions.some(
          (permission: { action: string }) =>
            permission.action === "plugin::review-workflow.review.publish-without-review",
        );

        if (hasPublishWithoutReviewPermission) {
          strapi.log.debug(
            `Review workflow: User has "Publish Without Review" permission, skipping review check for ${uid} document ${documentId} locale ${locale}`,
          );
          return next();
        }
      } catch (error) {
        strapi.log.error("Review workflow: Error checking user permissions", error);
      }
    }

    // Check if there's an approved review for this document and locale
    const permissionService = strapi.plugin("review-workflow").service("permission");
    const blockReason = await permissionService.getPublishBlockReason(uid, documentId, locale);

    if (blockReason !== null) {
      throw new ReviewWorkflowError(permissionService.getBlockReasonMessage(blockReason));
    }

    strapi.log.debug(
      `Review workflow: Publish approved for ${uid} document ${documentId} locale ${locale}`,
    );

    return next();
  });

  strapi.log.info("Review workflow plugin initialized");
};
