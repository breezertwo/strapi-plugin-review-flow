type AdminUserLike = { id: number; firstname?: string | null; lastname?: string | null };

export const serializeUser = (user: AdminUserLike | null | undefined) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    firstname: user.firstname ?? null,
    lastname: user.lastname ?? null,
  };
};

export const serializeComment = (comment: any) => {
  if (!comment) {
    return null;
  }

  return {
    id: comment.id,
    documentId: comment.documentId,
    content: comment.content,
    commentType: comment.commentType,
    fieldName: comment.fieldName ?? null,
    resolved: comment.resolved ?? false,
    locale: comment.locale ?? null,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    author: serializeUser(comment.author),
  };
};

export const serializeReview = (review: any) => {
  if (!review) {
    return null;
  }

  return {
    id: review.id,
    documentId: review.documentId,
    assignedContentType: review.assignedContentType,
    assignedDocumentId: review.assignedDocumentId,
    locale: review.locale,
    status: review.status,
    reviewedAt: review.reviewedAt ?? null,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    assignedTo: serializeUser(review.assignedTo),
    assignedBy: serializeUser(review.assignedBy),
    comments: Array.isArray(review.comments) ? review.comments.map(serializeComment) : [],
    ...(review.documentTitle !== undefined && { documentTitle: review.documentTitle }),
  };
};
