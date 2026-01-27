import type { Core } from '@strapi/strapi';

export type PublishBlockReason =
  | 'NO_REVIEW'
  | 'REVIEW_PENDING'
  | 'REVIEW_REJECTED'
  | 'MODIFIED_AFTER_APPROVAL'
  | null;

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  async canPublish(contentType: string, documentId: string, locale: string): Promise<boolean> {
    const reason = await this.getPublishBlockReason(contentType, documentId, locale);
    return reason === null;
  },

  async getPublishBlockReason(
    contentType: string,
    documentId: string,
    locale: string
  ): Promise<PublishBlockReason> {
    // Get the latest review for this document
    const review = await strapi
      .plugin('review-workflow')
      .service('review-workflow')
      .getReviewStatus(contentType, documentId, locale);

    if (!review) {
      return 'NO_REVIEW';
    }

    if (review.status === 'pending') {
      return 'REVIEW_PENDING';
    }

    if (review.status === 'rejected') {
      return 'REVIEW_REJECTED';
    }

    // Review is approved - check if document was modified after approval
    if (review.status === 'approved') {
      try {
        const document = await strapi.documents(contentType as any).findOne({
          documentId,
          locale,
          status: 'published',
        });

        if (document && document.updatedAt && review.reviewedAt) {
          const documentUpdatedAt = new Date(document.updatedAt).getTime();
          const reviewApprovedAt = new Date(review.reviewedAt).getTime();

          if (documentUpdatedAt > reviewApprovedAt) {
            return 'MODIFIED_AFTER_APPROVAL';
          }
        }

        // Document hasn't been modified since approval - can publish
        return null;
      } catch (error) {
        strapi.log.error('Review workflow: Error checking document modification time', error);
        return null;
      }
    }

    return 'NO_REVIEW';
  },

  getBlockReasonMessage(reason: PublishBlockReason): string {
    switch (reason) {
      case 'NO_REVIEW':
        return 'This document has not been reviewed yet. Please request a review before publishing.';
      case 'REVIEW_PENDING':
        return 'This document has a pending review. Please wait for the review to be approved before publishing.';
      case 'REVIEW_REJECTED':
        return 'This document was rejected during review. Please re-request a review after making the necessary changes.';
      case 'MODIFIED_AFTER_APPROVAL':
        return 'This document was modified after it was approved. Please request a new review before publishing.';
      default:
        return 'This document cannot be published. Please request a review first.';
    }
  },

  async canApprove(reviewId: string, userId: number): Promise<boolean> {
    const review = await strapi.documents('plugin::review-workflow.review-workflow').findOne({
      documentId: reviewId,
      populate: ['assignedTo', 'assignedBy'],
    });

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

  async hasApprovedReview(
    contentType: string,
    documentId: string,
    locale: string
  ): Promise<boolean> {
    const review = await strapi
      .plugin('review-workflow')
      .service('review-workflow')
      .getReviewStatus(contentType, documentId, locale);

    return review?.status === 'approved';
  },
});

export default service;
