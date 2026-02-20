import type { Review, ReviewGroup, LocaleReview } from '../types/review';

export function groupReviews(reviews: Review[]): ReviewGroup[] {
  const groupMap = new Map<string, ReviewGroup>();

  for (const review of reviews) {
    const key = `${review.assignedDocumentId}-${review.assignedContentType}`;

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        key,
        assignedDocumentId: review.assignedDocumentId,
        assignedContentType: review.assignedContentType,
        documentTitle: review.documentTitle ?? null,
        assignedBy: review.assignedBy,
        assignedTo: review.assignedTo,
        locales: [],
      });
    }

    const localeEntry: LocaleReview = {
      locale: review.locale,
      reviewDocumentId: review.documentId,
      status: review.status as LocaleReview['status'],
      comments: review.comments,
      reviewedAt: review.reviewedAt,
    };

    groupMap.get(key)!.locales.push(localeEntry);
  }

  return Array.from(groupMap.values());
}
