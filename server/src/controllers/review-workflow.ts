import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';

type StrapiRequest = {
  body: any;
} & Context['request'];

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  async assignReview(ctx: Context) {
    const { assignedContentType, assignedDocumentId, locale, assignedTo, comments } = (
      ctx.request as StrapiRequest
    ).body;
    const user = ctx.state.user;

    try {
      const review = await strapi.plugin('review-workflow').service('reviewWorkflow').assignReview({
        assignedContentType,
        assignedDocumentId,
        locale,
        assignedTo,
        assignedBy: user.id,
        comments,
      });

      ctx.body = { data: review };
    } catch (error) {
      ctx.throw(400, error.message);
    }
  },

  async approveReview(ctx) {
    const { id } = ctx.params;
    const { comments } = ctx.request.body;
    const user = ctx.state.user;

    try {
      const review = await strapi
        .plugin('review-workflow')
        .service('reviewWorkflow')
        .approveReview(id, user.id, comments);

      ctx.body = { data: review };
    } catch (error) {
      ctx.throw(400, error.message);
    }
  },

  async rejectReview(ctx: Context) {
    const { id } = ctx.params;
    const { comments } = (ctx.request as StrapiRequest).body;
    const user = ctx.state.user;

    try {
      const review = await strapi
        .plugin('review-workflow')
        .service('reviewWorkflow')
        .rejectReview(id, user.id, comments);

      ctx.body = { data: review };
    } catch (error) {
      ctx.throw(400, error.message);
    }
  },

  async getReviewStatus(ctx: Context) {
    const { assignedContentType, assignedDocumentId, locale } = ctx.params;

    try {
      const review = await strapi
        .plugin('review-workflow')
        .service('reviewWorkflow')
        .getReviewStatus(assignedContentType, assignedDocumentId, locale);

      ctx.body = { data: review };
    } catch (error) {
      ctx.throw(404, 'Review not found');
    }
  },

  async getBatchReviewStatuses(ctx: Context) {
    const { assignedContentType, locale } = ctx.params;
    const { documentIds } = (ctx.request as StrapiRequest).body;

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      ctx.throw(400, 'documentIds must be a non-empty array');
      return;
    }

    try {
      const statusMap = await strapi
        .plugin('review-workflow')
        .service('reviewWorkflow')
        .getReviewStatusesForDocuments(assignedContentType, documentIds, locale);

      // Convert Map to plain object for JSON serialization
      const statuses: Record<string, string | null> = {};
      statusMap.forEach((value: string | null, key: string) => {
        statuses[key] = value;
      });

      ctx.body = { data: statuses };
    } catch (error) {
      ctx.throw(400, error.message);
    }
  },

  async listPendingReviews(ctx) {
    const user = ctx.state.user;

    try {
      const reviews = await strapi
        .plugin('review-workflow')
        .service('reviewWorkflow')
        .listPendingReviews(user.id);

      ctx.body = { data: reviews };
    } catch (error) {
      ctx.throw(400, error.message);
    }
  },
});

export default controller;
