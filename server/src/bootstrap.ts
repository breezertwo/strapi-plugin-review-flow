import type { Core, UID } from '@strapi/strapi';

export default async ({ strapi }: { strapi: Core.Strapi }) => {
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
