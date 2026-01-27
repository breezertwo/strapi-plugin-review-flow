import type { Core, UID } from '@strapi/strapi';

// Custom error class for review workflow errors
class ReviewWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReviewWorkflowError';
  }
}

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  // koa error-handling middleware to catch ReviewWorkflowError and transform to proper error message
  strapi.server.use(async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      if (error instanceof ReviewWorkflowError) {
        ctx.status = 400;
        ctx.body = {
          data: null,
          error: {
            message: error.message,
          },
        };
        return;
      }
      // Re-throw other errors to be handled by Strapi's default error handler
      throw error;
    }
  });

  // koa middleware to intercept content-manager requests for reviewStatus sorting
  strapi.server.use(async (ctx, next) => {
    const { url, method } = ctx.request;

    // Only intercept GET requests to content-manager collection-types
    if (method !== 'GET' || !url.includes('/content-manager/collection-types/')) {
      return next();
    }

    // Check if sorting by reviewStatus
    const sortParam = ctx.query.sort as string;
    if (!sortParam || !sortParam.includes('reviewStatus')) {
      return next();
    }

    // Parse sort direction
    const sortMatch = sortParam.match(/reviewStatus:(ASC|DESC)/i);
    if (!sortMatch) {
      return next();
    }

    const sortDirection = sortMatch[1].toUpperCase() as 'ASC' | 'DESC';

    // Extract content type from URL
    const urlMatch = url.match(/\/content-manager\/collection-types\/([^?]+)/);
    if (!urlMatch) {
      return next();
    }

    const contentType = urlMatch[1] as UID.ContentType;

    // Remove reviewStatus from sort for the secondary sort
    const secondarySort =
      sortParam
        .split(',')
        .filter((s) => !s.includes('reviewStatus'))
        .join(',') || 'createdAt:DESC';

    // Parse locale from query - it can be nested or flat depending on how Koa parses it
    const locale = ctx.query.locale as string | undefined;
    if (!locale) {
      strapi.log.warn('No locale provided');
      ctx.query.sort = secondarySort;
      return next();
    }

    const page = parseInt(ctx.query.page as string) || 1;
    const pageSize = parseInt(ctx.query.pageSize as string) || 10;

    strapi.log.info(
      `Review workflow sort: contentType=${contentType}, locale=${locale}, page=${page}, pageSize=${pageSize}`
    );

    try {
      // Step 1: Get ALL document IDs for this content type (without pagination)
      const allDocuments = await strapi.documents(contentType).findMany({
        locale,
        fields: ['documentId'],
      });

      strapi.log.info(
        `Review workflow sort: Found ${allDocuments.length} documents for locale ${locale}`
      );

      const allDocumentIds = allDocuments.map((d: any) => d.documentId).filter(Boolean);

      if (allDocumentIds.length === 0) {
        return next();
      }

      // Step 2: Fetch review statuses for ALL documents
      const statusMap = await strapi
        .plugin('review-workflow')
        .service('reviewWorkflow')
        .getReviewStatusesForDocuments(contentType, allDocumentIds, locale);

      // Step 3: Define sort order for statuses
      const statusOrder: Record<string, number> = {
        approved: 1,
        pending: 2,
        rejected: 3,
      };
      const noReviewOrder = 4;

      // Step 4: Sort ALL document IDs by review status
      const sortedDocumentIds = [...allDocumentIds].sort((a, b) => {
        const statusA = statusMap.get(a);
        const statusB = statusMap.get(b);

        const orderA = statusA ? statusOrder[statusA] || noReviewOrder : noReviewOrder;
        const orderB = statusB ? statusOrder[statusB] || noReviewOrder : noReviewOrder;

        if (sortDirection === 'ASC') {
          return orderA - orderB;
        } else {
          return orderB - orderA;
        }
      });

      // Step 5: Apply pagination to get the IDs for the current page
      const startIndex = (page - 1) * pageSize;
      const paginatedDocumentIds = sortedDocumentIds.slice(startIndex, startIndex + pageSize);

      if (paginatedDocumentIds.length === 0) {
        ctx.body = {
          results: [],
          pagination: {
            page,
            pageSize,
            pageCount: Math.ceil(sortedDocumentIds.length / pageSize),
            total: sortedDocumentIds.length,
          },
        };
        return;
      }

      // Step 6: Fetch the full draft documents for the current page
      const draftDocuments = await strapi.documents(contentType).findMany({
        locale,
        filters: {
          documentId: { $in: paginatedDocumentIds },
        },
        fields: '*',
        populate: '*',
      });

      // Step 7: Fetch the published versions to compute document status
      const publishedDocuments = await strapi.documents(contentType).findMany({
        locale,
        status: 'published',
        filters: {
          documentId: { $in: paginatedDocumentIds },
        },
        fields: '*',
        populate: '*',
      });

      // Create a map of published documents by documentId
      const publishedMap = new Map(publishedDocuments.map((d: any) => [d.documentId, d]));

      strapi.log.info(
        `Review workflow sort: Fetched ${draftDocuments.length} draft and ${publishedDocuments.length} published documents for page ${page}`
      );

      // Step 8: Compute document status and add to each document
      // TODO: For some edge cases the status can be 'modified' even if the document has not been modified. I need to investigate this further.
      const documentsWithStatus = draftDocuments.map((doc: any) => {
        const publishedDoc = publishedMap.get(doc.documentId);

        let status: 'draft' | 'published' | 'modified';
        if (!publishedDoc) {
          status = 'draft';
        } else if (
          doc.updatedAt &&
          publishedDoc.updatedAt &&
          new Date(doc.updatedAt).getTime() === new Date(publishedDoc.updatedAt).getTime()
        ) {
          status = 'published';
        } else {
          status = 'modified';
        }

        return {
          ...doc,
          status,
        };
      });

      // Step 9: Re-sort the fetched documents to match the review status order
      const documentMap = new Map(documentsWithStatus.map((d: any) => [d.documentId, d]));
      const orderedResults = paginatedDocumentIds.map((id) => documentMap.get(id)).filter(Boolean);

      // Step 10: Return the results with correct pagination info
      ctx.body = {
        results: orderedResults,
        pagination: {
          page,
          pageSize,
          pageCount: Math.ceil(sortedDocumentIds.length / pageSize),
          total: sortedDocumentIds.length,
        },
      };
      return;
    } catch (error) {
      strapi.log.error('Review workflow: Error sorting by review status', error);
      ctx.query.sort = secondarySort;
      return next();
    }
  });

  // Register lifecycle hooks for content types with draft/publish
  const contentTypes = Object.keys(strapi.contentTypes) as UID.ContentType[];

  for (const uid of contentTypes) {
    const contentType = strapi.contentType(uid);

    // Only apply to API content types with draftAndPublish enabled
    if (contentType?.options?.draftAndPublish && uid.startsWith('api::')) {
      strapi.log.info(`Review workflow: Registering lifecycle hooks for ${uid}`);

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
        const locale = context.params?.locale || 'en';

        if (!documentId) {
          return next();
        }

        strapi.log.info(
          `Review workflow: Checking publish permission for ${uid} document ${documentId} locale ${locale}`
        );

        // Check if there's an approved review for this document and locale
        const permissionService = strapi.plugin('review-workflow').service('permission');
        const blockReason = await permissionService.getPublishBlockReason(uid, documentId, locale);

        if (blockReason !== null) {
          throw new ReviewWorkflowError(permissionService.getBlockReasonMessage(blockReason));
        }

        strapi.log.info(
          `Review workflow: Publish approved for ${uid} document ${documentId} locale ${locale}`
        );

        return next();
      });
    }
  }

  strapi.log.info('Review workflow plugin initialized');
};
