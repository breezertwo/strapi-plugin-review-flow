import type { Core } from '@strapi/strapi';

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  async canPublish(contentType: string, documentId: string): Promise<boolean> {
    const review = await strapi
      .plugin('review-workflow')
      .service('reviewWorkflow')
      .getReviewStatus(contentType, documentId);

    // If no review exists, cannot publish
    if (!review) {
      return false;
    }

    // Can only publish if review is approved
    return review.status === 'approved';
  },

  async canApprove(reviewId: string, userId: number): Promise<boolean> {
    const review = await strapi.documents('plugin::review-workflow.review-workflow').findOne({
      documentId: reviewId,
      populate: ['assignedTo', 'assignedBy'],
    });

    console.log('canApprove', review);
    console.log('ctx user', userId);

    if (!review) {
      return false;
    }

    // User must be the assigned reviewer
    if (review.assignedTo.id !== userId) {
      return false;
    }

    // Cannot approve own submission
    if (review.assignedBy.id === userId) {
      return false;
    }

    // Review must be pending
    return review.status === 'pending';
  },

  async hasApprovedReview(contentType: string, documentId: string): Promise<boolean> {
    const review = await strapi
      .plugin('review-workflow')
      .service('reviewWorkflow')
      .getReviewStatus(contentType, documentId);

    return review?.status === 'approved';
  },
});

export default service;
