import type { Core } from '@strapi/strapi';

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  async assignReview(data: {
    assignedContentType: string;
    assignedDocumentId: string;
    locale: string;
    assignedTo: number;
    assignedBy: number;
    comments?: string;
  }) {
    // Check if there's already a pending review for this document and locale
    const existingReview = await this.getReviewStatus(
      data.assignedContentType,
      data.assignedDocumentId,
      data.locale
    );

    if (existingReview && existingReview.status === 'pending') {
      throw new Error('A pending review already exists for this document and locale');
    }

    const review = await strapi.documents('plugin::review-workflow.review-workflow').create({
      data: {
        ...data,
        status: 'pending',
      },
      populate: ['assignedTo', 'assignedBy'],
    });

    return review;
  },

  async approveReview(id: string, userId: number, locale: string, comments?: string) {
    const review = await strapi.documents('plugin::review-workflow.review-workflow').findOne({
      documentId: id,
      locale,
      populate: ['assignedTo'],
    });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.assignedTo.id !== userId) {
      throw new Error('Only the assigned reviewer can approve this review');
    }

    if (review.status !== 'pending') {
      throw new Error('Only pending reviews can be approved');
    }

    const updatedReview = await strapi.documents('plugin::review-workflow.review-workflow').update({
      documentId: id,
      filters: {
        locale,
      },
      data: {
        status: 'approved',
        comments: comments || review.comments,
        reviewedAt: new Date(),
      } as any,
      populate: ['assignedTo', 'assignedBy'],
    });

    return updatedReview;
  },

  async rejectReview(id: string, userId: number, locale: string, comments?: string) {
    const review = await strapi.documents('plugin::review-workflow.review-workflow').findOne({
      documentId: id,
      filters: {
        locale,
      },
      populate: ['assignedTo'],
    });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.assignedTo.id !== userId) {
      throw new Error('Only the assigned reviewer can reject this review');
    }

    if (review.status !== 'pending') {
      throw new Error('Only pending reviews can be rejected');
    }

    const updatedReview = await strapi.documents('plugin::review-workflow.review-workflow').update({
      documentId: id,
      filters: {
        locale,
      },
      data: {
        status: 'rejected',
        comments: comments || review.comments,
        reviewedAt: new Date(),
      } as any,
      populate: ['assignedTo', 'assignedBy'],
    });

    return updatedReview;
  },

  async getReviewStatus(_: string, assignedDocumentId: string, locale: string) {
    const reviews = await strapi.documents('plugin::review-workflow.review-workflow').findMany({
      filters: {
        assignedDocumentId,
        locale,
      },
      sort: { createdAt: 'desc' },
      limit: 1,
      populate: ['assignedTo', 'assignedBy'],
    });

    return reviews[0] || null;
  },

  async listPendingReviews(userId: number) {
    const reviews = await strapi.documents('plugin::review-workflow.review-workflow').findMany({
      filters: {
        assignedTo: userId,
        status: 'pending',
      },
      sort: { createdAt: 'desc' },
      populate: ['assignedTo', 'assignedBy'],
    });

    return reviews;
  },

  async listAssignedByUserReviews(userId: number) {
    const reviews = await strapi.documents('plugin::review-workflow.review-workflow').findMany({
      filters: {
        assignedBy: userId,
        status: 'pending',
      },
      sort: { createdAt: 'desc' },
      populate: ['assignedTo', 'assignedBy'],
    });

    return reviews;
  },

  async getDocumentTitle(contentType: string, documentId: string, locale: string) {
    try {
      // Try to find the document with the given content type and document ID
      const document = await strapi.documents(contentType as any).findOne({
        documentId,
        locale,
        status: 'draft',
      });

      if (!document) {
        return null;
      }

      // Try common title field names
      const titleFields = ['title', 'name', 'displayName', 'label', 'heading', 'subject'];
      for (const field of titleFields) {
        if (document[field] && typeof document[field] === 'string') {
          return document[field];
        }
      }

      // If no title field found, try to get the main field from content type schema
      const contentTypeSchema = strapi.contentTypes[contentType];
      if (contentTypeSchema?.pluginOptions?.['content-manager']?.mainField) {
        const mainField = contentTypeSchema.pluginOptions['content-manager'].mainField;
        if (document[mainField] && typeof document[mainField] === 'string') {
          return document[mainField];
        }
      }

      // Fallback to document ID
      return null;
    } catch (error) {
      // If the content type doesn't exist or other error, return null
      return null;
    }
  },

  async enrichReviewsWithTitles(reviews: any[]) {
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        const title = await this.getDocumentTitle(
          review.assignedContentType,
          review.assignedDocumentId,
          review.locale
        );
        return {
          ...review,
          documentTitle: title,
        };
      })
    );

    return enrichedReviews;
  },

  async getReviewStatusesForDocuments(
    assignedContentType: string,
    documentIds: string[],
    locale: string
  ): Promise<Map<string, string | null>> {
    if (documentIds.length === 0) {
      return new Map();
    }

    const reviews = await strapi.documents('plugin::review-workflow.review-workflow').findMany({
      filters: {
        locale,
        assignedContentType,
        assignedDocumentId: { $in: documentIds },
      },
      sort: { createdAt: 'desc' },
    });

    const statusMap = new Map<string, string | null>();
    for (const docId of documentIds) {
      // get latest review as sorted by createdAt desc
      const review = reviews.find((r: any) => r.assignedDocumentId === docId);
      statusMap.set(docId, review?.status || null);
    }

    return statusMap;
  },
});

export default service;
