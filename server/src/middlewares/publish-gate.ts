import type { Core, UID } from '@strapi/strapi';

const middleware = ({ strapi }: { strapi: Core.Strapi }) => {
  return async (ctx, next) => {
    // Only intercept publish actions
    const isPublishAction = ctx.request.body?.data?.publishedAt !== undefined;

    if (!isPublishAction) {
      return next();
    }

    // Extract content type and document ID
    const contentType = ctx.params.model || ctx.state.route?.info?.apiName;
    const documentId = ctx.params.id || ctx.params.documentId;

    if (!contentType || !documentId) {
      return next();
    }

    // Check if this content type should use the review workflow
    // You can configure which content types require review
    const requiresReview = await shouldRequireReview(strapi, contentType);

    if (!requiresReview) {
      return next();
    }

    // Check if there's an approved review
    const canPublish = await strapi
      .plugin('review-workflow')
      .service('permission')
      .canPublish(contentType, documentId);

    if (!canPublish) {
      ctx.throw(403, 'Document must be reviewed and approved before publishing');
    }

    await next();
  };
};

async function shouldRequireReview(
  strapi: Core.Strapi,
  contentType: UID.ContentType
): Promise<boolean> {
  // TODO: Make this configurable via plugin settings
  // For now, all content types with draft/publish require review
  const model = strapi.contentType(contentType);
  return model?.options?.draftAndPublish === true;
}

export default middleware;
