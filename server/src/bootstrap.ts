import type { Core, UID } from '@strapi/strapi';

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  // Add Koa middleware to intercept content-manager requests for reviewStatus sorting
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

    // Remove reviewStatus from sort and add a default sort if needed
    const newSort = sortParam
      .split(',')
      .filter((s) => !s.includes('reviewStatus'))
      .join(',');

    ctx.query.sort = newSort || 'createdAt:DESC';

    // Continue with the request
    await next();

    // After the response, sort the results by review status
    if (ctx.body?.results && Array.isArray(ctx.body.results)) {
      const results = ctx.body.results;

      // Extract content type from URL
      const urlMatch = url.match(/\/content-manager\/collection-types\/([^?]+)/);
      if (!urlMatch) return;

      const contentType = urlMatch[1];
      const locale = (ctx.query['plugins[i18n][locale]'] as string) || 'en';

      // Get document IDs
      const documentIds = results.map((r: any) => r.documentId).filter(Boolean);

      if (documentIds.length === 0) return;

      // Fetch review statuses for all documents
      const statusMap = await strapi
        .plugin('review-workflow')
        .service('reviewWorkflow')
        .getReviewStatusesForDocuments(contentType, documentIds, locale);

      // Define sort order for statuses
      const statusOrder: Record<string, number> = {
        approved: 1,
        pending: 2,
        rejected: 3,
      };
      const noReviewOrder = 4;

      // Sort results based on review status
      results.sort((a: any, b: any) => {
        const statusA = statusMap.get(a.documentId);
        const statusB = statusMap.get(b.documentId);

        console.log('statusA', statusA, 'statusB', statusB);

        const orderA = statusA ? statusOrder[statusA] || noReviewOrder : noReviewOrder;
        const orderB = statusB ? statusOrder[statusB] || noReviewOrder : noReviewOrder;

        if (sortDirection === 'ASC') {
          return orderA - orderB;
        } else {
          return orderB - orderA;
        }
      });

      ctx.body.results = results;
    }
  });

  // Register lifecycle hooks for content types with draft/publish
  const contentTypes = Object.keys(strapi.contentTypes) as UID.ContentType[];

  for (const uid of contentTypes) {
    const contentType = strapi.contentType(uid);

    // Only apply to API content types with draftAndPublish enabled
    // Skip admin::, plugin::, and strapi:: content types
    if (contentType?.options?.draftAndPublish && uid.startsWith('api::')) {
      strapi.log.info(`Review workflow: Registering lifecycle hooks for ${uid}`);

      // Subscribe to lifecycle events
      strapi.documents.use(async (context, next) => {
        // Only intercept publish actions for this content type
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

        strapi.log.debug(
          `Review workflow: Checking publish permission for ${uid} document ${documentId} locale ${locale}`
        );

        // Check if there's an approved review for this document and locale
        const canPublish = await strapi
          .plugin('review-workflow')
          .service('permission')
          .canPublish(uid, documentId, locale);

        if (!canPublish) {
          throw new Error(
            'Document must be reviewed and approved before publishing. Please request a review first.'
          );
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
