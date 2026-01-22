import type { Core, UID } from '@strapi/strapi';

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  // Register lifecycle hooks for content types with draft/publish
  const contentTypes = Object.keys(strapi.contentTypes) as UID.ContentType[];

  for (const uid of contentTypes) {
    const contentType = strapi.contentType(uid);

    // Only apply to content types with draftAndPublish enabled
    if (contentType?.options?.draftAndPublish) {
      // Subscribe to lifecycle events
      strapi.db.lifecycles.subscribe({
        models: [uid],

        async beforeUpdate(event) {
          const { params } = event;

          // Check if this is a publish action (setting publishedAt)
          if (params?.data?.publishedAt !== undefined && params?.data?.publishedAt !== null) {
            const documentId = params.where?.documentId || params.where?.id;

            if (documentId) {
              const canPublish = await strapi
                .plugin('review-workflow')
                .service('permission')
                .canPublish(uid, documentId);

              if (!canPublish) {
                throw new Error('Document must be reviewed and approved before publishing');
              }
            }
          }
        },

        async afterUpdate(event) {
          const { result, params } = event;

          // If content was approved but now edited, log for potential new review
          if (result?.documentId && params?.data) {
            const review = await strapi
              .plugin('review-workflow')
              .service('reviewWorkflow')
              .getReviewStatus(uid, result.documentId);

            // If content was approved but now edited, create new review requirement
            if (review?.status === 'approved') {
              strapi.log.info(
                `Document ${result.documentId} was updated after approval - new review may be required`
              );
            }
          }
        },
      });
    }
  }

  strapi.log.info('Review workflow plugin initialized');
};
