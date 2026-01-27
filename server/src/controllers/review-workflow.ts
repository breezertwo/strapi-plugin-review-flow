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

    console.log('assignReview', assignedDocumentId, locale);

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

  async approveReview(ctx: Context) {
    const { id, locale } = ctx.params;
    const { comments } = (ctx.request as StrapiRequest).body;
    const user = ctx.state.user;

    try {
      const review = await strapi
        .plugin('review-workflow')
        .service('reviewWorkflow')
        .approveReview(id, user.id, locale || 'en', comments);

      ctx.body = { data: review };
    } catch (error) {
      ctx.throw(400, error.message);
    }
  },

  async rejectReview(ctx: Context) {
    const { id, locale } = ctx.params;
    const { rejectionReason } = (ctx.request as StrapiRequest).body;
    const user = ctx.state.user;

    try {
      const review = await strapi
        .plugin('review-workflow')
        .service('reviewWorkflow')
        .rejectReview(id, user.id, locale || 'en', rejectionReason);

      ctx.body = { data: review };
    } catch (error) {
      ctx.throw(400, error.message);
    }
  },

  async reRequestReview(ctx: Context) {
    const { id, locale } = ctx.params;
    const { comment } = (ctx.request as StrapiRequest).body;
    const user = ctx.state.user;

    try {
      const review = await strapi
        .plugin('review-workflow')
        .service('reviewWorkflow')
        .reRequestReview(id, user.id, locale || 'en', comment);

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

  async listPendingReviews(ctx: Context) {
    const user = ctx.state.user;

    try {
      const reviews = await strapi
        .plugin('review-workflow')
        .service('reviewWorkflow')
        .listPendingReviews(user.id);

      // Enrich reviews with document titles
      const enrichedReviews = await strapi
        .plugin('review-workflow')
        .service('reviewWorkflow')
        .enrichReviewsWithTitles(reviews);

      ctx.body = { data: enrichedReviews };
    } catch (error) {
      ctx.throw(400, error.message);
    }
  },

  async listRejectedReviews(ctx: Context) {
    const user = ctx.state.user;

    try {
      const reviews = await strapi
        .plugin('review-workflow')
        .service('reviewWorkflow')
        .listRejectedReviewsForUser(user.id);

      // Enrich reviews with document titles
      const enrichedReviews = await strapi
        .plugin('review-workflow')
        .service('reviewWorkflow')
        .enrichReviewsWithTitles(reviews);

      ctx.body = { data: enrichedReviews };
    } catch (error) {
      ctx.throw(400, error.message);
    }
  },

  async listAssignedByUserReviews(ctx: Context) {
    const user = ctx.state.user;

    try {
      const reviews = await strapi
        .plugin('review-workflow')
        .service('reviewWorkflow')
        .listAssignedByUserReviews(user.id);

      // Enrich reviews with document titles
      const enrichedReviews = await strapi
        .plugin('review-workflow')
        .service('reviewWorkflow')
        .enrichReviewsWithTitles(reviews);

      ctx.body = { data: enrichedReviews };
    } catch (error) {
      ctx.throw(400, error.message);
    }
  },

  async bulkAssignReviews(ctx: Context) {
    const { assignedContentType, assignedTo, comments, documents } = (ctx.request as StrapiRequest)
      .body;
    const user = ctx.state.user;

    if (!Array.isArray(documents) || documents.length === 0) {
      ctx.throw(400, 'documents must be a non-empty array');
      return;
    }

    const results: { success: string[]; failed: { documentId: string; error: string }[] } = {
      success: [],
      failed: [],
    };

    for (const doc of documents) {
      try {
        await strapi
          .plugin('review-workflow')
          .service('reviewWorkflow')
          .assignReview({
            assignedContentType,
            assignedDocumentId: doc.documentId,
            locale: doc.locale || 'en',
            assignedTo,
            assignedBy: user.id,
            comments,
          });
        results.success.push(doc.documentId);
      } catch (error) {
        results.failed.push({
          documentId: doc.documentId,
          error: error.message,
        });
      }
    }

    ctx.body = { data: results };
  },

  async canBulkAssign(ctx: Context) {
    const user = ctx.state.user;

    try {
      // Check if user has the bulk-assign permission
      const permissions = await strapi.admin.services.permission.findUserPermissions(user);
      const hasBulkAssignPermission = permissions.some(
        (permission: { action: string }) =>
          permission.action === 'plugin::review-workflow.review.bulk-assign'
      );

      ctx.body = { data: { canBulkAssign: hasBulkAssignPermission } };
    } catch (error) {
      ctx.throw(400, error.message);
    }
  },
});

export default controller;
