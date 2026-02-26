import type { Core } from '@strapi/strapi';

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  async createFieldComment(data: {
    reviewDocumentId: string;
    authorId: number;
    content: string;
    fieldName: string;
    locale: string;
  }) {
    const review = await strapi.documents('plugin::review-workflow.review-workflow').findOne({
      documentId: data.reviewDocumentId,
      locale: data.locale,
      populate: ['assignedTo'],
    });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.status !== 'pending') {
      throw new Error('Field comments can only be added to pending reviews');
    }

    if (review.assignedTo?.id !== data.authorId) {
      throw new Error('Only the assigned reviewer can add field comments');
    }

    const comment = await strapi.documents('plugin::review-workflow.review-comment').create({
      data: {
        review: review.id,
        author: data.authorId,
        content: data.content,
        commentType: 'field-comment',
        fieldName: data.fieldName,
        resolved: false,
        locale: data.locale,
      },
      populate: ['author'],
    });

    return comment;
  },

  async deleteFieldComment(commentDocumentId: string, userId: number) {
    const comment = await strapi.documents('plugin::review-workflow.review-comment').findOne({
      documentId: commentDocumentId,
      populate: ['author', 'review', 'review.assignedTo'],
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.commentType !== 'field-comment') {
      throw new Error('Only field comments can be deleted');
    }

    if (comment.author?.id !== userId) {
      throw new Error('You can only delete your own field comments');
    }

    if (comment.review?.status !== 'pending') {
      throw new Error('Field comments can only be deleted while the review is pending');
    }

    await strapi.documents('plugin::review-workflow.review-comment').delete({
      documentId: commentDocumentId,
    });
  },

  async resolveFieldComment(commentDocumentId: string, userId: number) {
    const comment = await strapi.documents('plugin::review-workflow.review-comment').findOne({
      documentId: commentDocumentId,
      populate: ['review', 'review.assignedBy'],
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.commentType !== 'field-comment') {
      throw new Error('Only field comments can be resolved');
    }

    if (comment.review?.assignedBy?.id !== userId) {
      throw new Error('Only the review requester can resolve field comments');
    }

    const updated = await strapi.documents('plugin::review-workflow.review-comment').update({
      documentId: commentDocumentId,
      data: { resolved: !comment.resolved } as any,
      populate: ['author'],
    });

    return updated;
  },

  async createComment(data: {
    reviewId: number;
    authorId: number;
    content: string;
    commentType: 'assignment' | 'rejection' | 're-request' | 'approval' | 'general';
    locale: string;
  }) {
    try {
      const comment = await strapi.documents('plugin::review-workflow.review-comment').create({
        data: {
          review: data.reviewId,
          author: data.authorId,
          content: data.content,
          commentType: data.commentType,
          locale: data.locale,
        },
        populate: ['review', 'author'],
      });

      return comment;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  },

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

    const { comments, ...reviewData } = data;

    const review = await strapi.documents('plugin::review-workflow.review-workflow').create({
      data: {
        ...reviewData,
        status: 'pending',
      },
      populate: ['assignedTo', 'assignedBy', 'comments'],
    });

    // Create initial assignment comment if provided
    if (comments && comments.trim()) {
      await this.createComment({
        reviewId: review.id,
        authorId: data.assignedBy,
        content: comments,
        commentType: 'assignment',
        locale: data.locale,
      });
    }

    // Re-fetch to include the comment
    const updatedReview = await strapi
      .documents('plugin::review-workflow.review-workflow')
      .findOne({
        documentId: data.assignedDocumentId,
        locale: data.locale,
        populate: ['assignedTo', 'assignedBy', 'comments'],
      });

    return updatedReview;
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

    // Block approval if the reviewer has added field comments — they must either remove them or reject
    const openFieldComments = await strapi
      .documents('plugin::review-workflow.review-comment')
      .findMany({
        filters: {
          review: review.id,
          commentType: 'field-comment',
        } as any,
      });
    if (openFieldComments.length > 0) {
      throw new Error(
        'You need to either remove your comments or reject the current request before approving this content'
      );
    }

    const updatedReview = await strapi.documents('plugin::review-workflow.review-workflow').update({
      documentId: id,
      locale,
      data: {
        status: 'approved',
        reviewedAt: new Date(),
      } as any,
      populate: ['assignedTo', 'assignedBy', 'comments', 'comments.author'],
    });

    // Create approval comment if provided
    if (comments && comments.trim()) {
      await this.createComment({
        reviewId: updatedReview.id,
        authorId: userId,
        content: comments,
        commentType: 'approval',
        locale,
      });
    }

    // Clean up all field comments for this review
    const fieldComments = await strapi.documents('plugin::review-workflow.review-comment').findMany({
      filters: {
        review: updatedReview.id,
        commentType: 'field-comment',
      } as any,
    });
    for (const fc of fieldComments) {
      await strapi.documents('plugin::review-workflow.review-comment').delete({
        documentId: fc.documentId,
      });
    }

    // Re-fetch to include the new comment
    const finalReview = await strapi.documents('plugin::review-workflow.review-workflow').findOne({
      documentId: id,
      populate: ['assignedTo', 'assignedBy', 'comments', 'comments.author'],
    });

    return finalReview;
  },

  async rejectReview(id: string, userId: number, locale: string, rejectionReason: string) {
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new Error('Rejection reason is required');
    }

    const review = await strapi.documents('plugin::review-workflow.review-workflow').findOne({
      documentId: id,
      locale,
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
      locale,
      data: {
        status: 'rejected',
        reviewedAt: new Date(),
      } as any,
      populate: ['assignedTo', 'assignedBy', 'comments', 'comments.author'],
    });

    await this.createComment({
      reviewId: updatedReview.id,
      authorId: userId,
      content: rejectionReason,
      commentType: 'rejection',
      locale,
    });

    const finalReview = await strapi.documents('plugin::review-workflow.review-workflow').findOne({
      documentId: id,
      populate: ['assignedTo', 'assignedBy', 'comments', 'comments.author'],
    });

    return finalReview;
  },

  async reRequestReview(id: string, userId: number, locale: string, comment: string) {
    if (!comment || !comment.trim()) {
      throw new Error('Comment is required when re-requesting a review');
    }

    const review = await strapi.documents('plugin::review-workflow.review-workflow').findOne({
      documentId: id,
      locale,
      populate: ['assignedTo', 'assignedBy', 'comments'],
    });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.assignedBy.id !== userId) {
      throw new Error('Only the person who assigned the review can re-request it');
    }

    if (review.status !== 'rejected') {
      throw new Error('Only rejected reviews can be re-requested');
    }

    // Block re-request if there are unresolved field comments
    const unresolvedFieldComments = (review.comments || []).filter(
      (c: any) => c.commentType === 'field-comment' && !c.resolved
    );
    if (unresolvedFieldComments.length > 0) {
      throw new Error(
        `You have ${unresolvedFieldComments.length} unresolved field comment(s). Please resolve them before re-requesting.`
      );
    }

    const updatedReview = await strapi.documents('plugin::review-workflow.review-workflow').update({
      documentId: id,
      locale,
      data: {
        status: 'pending',
        reviewedAt: null,
      } as any,
      populate: ['assignedTo', 'assignedBy', 'comments', 'comments.author'],
    });

    await this.createComment({
      reviewId: updatedReview.id,
      authorId: userId,
      content: comment,
      commentType: 're-request',
      locale,
    });

    const finalReview = await strapi.documents('plugin::review-workflow.review-workflow').findOne({
      documentId: id,
      populate: ['assignedTo', 'assignedBy', 'comments', 'comments.author'],
    });

    return finalReview;
  },

  async getReviewStatus(_: string, assignedDocumentId: string, locale: string) {
    const reviews = await strapi.documents('plugin::review-workflow.review-workflow').findMany({
      filters: {
        assignedDocumentId,
        locale,
      },
      sort: { createdAt: 'desc' },
      limit: 1,
      populate: ['assignedTo', 'assignedBy', 'comments', 'comments.author'],
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
      populate: ['assignedTo', 'assignedBy', 'comments', 'comments.author'],
    });

    return reviews;
  },

  async listRejectedReviewsForUser(userId: number) {
    const reviews = await strapi.documents('plugin::review-workflow.review-workflow').findMany({
      filters: {
        assignedTo: userId,
        status: 'rejected',
      },
      sort: { reviewedAt: 'desc' },
      populate: ['assignedTo', 'assignedBy', 'comments', 'comments.author'],
    });

    return reviews;
  },

  async listAssignedByUserReviews(userId: number) {
    const reviews = await strapi.documents('plugin::review-workflow.review-workflow').findMany({
      filters: {
        assignedBy: userId,
        status: { $in: ['pending', 'rejected'] },
      },
      sort: { createdAt: 'desc' },
      populate: ['assignedTo', 'assignedBy', 'comments', 'comments.author'],
    });

    return reviews;
  },

  async getDocumentTitle(
    contentType: string,
    documentId: string,
    locale: string,
    titleField?: string
  ) {
    try {
      const document = await strapi.documents(contentType as any).findOne({
        documentId,
        locale,
        status: 'draft',
      });

      if (!document) {
        return null;
      }

      // If a custom titleField is configured, try it first before falling back
      if (titleField && document[titleField] && typeof document[titleField] === 'string') {
        return document[titleField];
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
      return null;
    }
  },

  async enrichReviewsWithTitles(reviews: any[]) {
    const titleField: string | undefined =
      strapi.plugin('review-workflow').config('titleField') || undefined;

    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        const title = await this.getDocumentTitle(
          review.assignedContentType,
          review.assignedDocumentId,
          review.locale,
          titleField
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

  async getAvailableLocales(contentType: string, documentId: string): Promise<string[]> {
    try {
      const entities = await strapi.db.query(contentType as any).findMany({
        where: { documentId },
        select: ['locale'],
      });
      return [...new Set((entities as any[]).map((e) => e.locale).filter(Boolean))];
    } catch (error) {
      return [];
    }
  },

  async assignMultiLocaleReviews(data: {
    assignedContentType: string;
    assignedDocumentId: string;
    locales: string[];
    assignedTo: number;
    assignedBy: number;
    comments?: string;
  }) {
    const results: { success: string[]; failed: { locale: string; error: string }[] } = {
      success: [],
      failed: [],
    };

    for (const locale of data.locales) {
      try {
        await this.assignReview({
          assignedContentType: data.assignedContentType,
          assignedDocumentId: data.assignedDocumentId,
          locale,
          assignedTo: data.assignedTo,
          assignedBy: data.assignedBy,
          comments: data.comments,
        });
        results.success.push(locale);
      } catch (error) {
        results.failed.push({ locale, error: error.message });
      }
    }

    return results;
  },

  getLatestCommentByType(comments: any[], commentType: string) {
    if (!comments || !Array.isArray(comments)) {
      return null;
    }

    const filtered = comments
      .filter((c) => c.commentType === commentType)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return filtered[0] || null;
  },

  async getReviewers(currentUserId: number) {
    const reviewers: { id: number; firstname: string; lastname: string; email: string }[] = [];
    const pageSize = 100;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const result = await strapi.admin.services.user.findPage({
        page,
        pageSize,
        filters: {
          isActive: true,
        },
      });

      const users = result.results || [];

      // Check each user for the review.handle permission
      for (const user of users) {
        // Skip the current user
        if (user.id === currentUserId) {
          continue;
        }

        // Check if user has the handle review permission
        const permissions = await strapi.admin.services.permission.findUserPermissions(user);
        const hasHandlePermission = permissions.some(
          (permission: { action: string }) =>
            permission.action === 'plugin::review-workflow.review.handle'
        );

        if (hasHandlePermission) {
          reviewers.push({
            id: user.id,
            firstname: user.firstname || '',
            lastname: user.lastname || '',
            email: user.email,
          });
        }
      }

      // Check if there are more pages
      const totalPages = Math.ceil(result.pagination.total / pageSize);
      hasMore = page < totalPages;
      page++;
    }

    return reviewers;
  },
});

export default service;
