export const reviewKeys = {
  all: ['reviews'] as const,
  pending: () => [...reviewKeys.all, 'pending'] as const,
  rejected: () => [...reviewKeys.all, 'rejected'] as const,
  assignedByMe: () => [...reviewKeys.all, 'assigned-by-me'] as const,
  status: (slug: string, id: string, locale: string) =>
    [...reviewKeys.all, 'status', slug, id, locale] as const,
  batchStatus: (model: string, locale: string, documentId: string) =>
    [...reviewKeys.all, 'batch-status', model, locale, documentId] as const,
  reviewers: () => [...reviewKeys.all, 'reviewers'] as const,
  availableLocales: (contentType: string, documentId: string) =>
    [...reviewKeys.all, 'available-locales', contentType, documentId] as const,
};

export const configKeys = {
  all: ['plugin-config'] as const,
};
