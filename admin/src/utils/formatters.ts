import type { Comment } from '../types/review';

export const formatContentType = (contentType: string): string => {
  const parts = contentType.split('.');
  const name = parts[parts.length - 1];
  return name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
};

export const getEditUrl = (contentType: string, documentId: string, locale: string): string => {
  return `/content-manager/collection-types/${contentType}/${documentId}?plugins[i18n][locale]=${locale}`;
};

export const getStatusBadgeProps = (status: string): { background: string; textColor: string } => {
  switch (status) {
    case 'pending':
      return { background: 'warning100', textColor: 'warning700' };
    case 'approved':
      return { background: 'success100', textColor: 'success700' };
    case 'rejected':
      return { background: 'danger100', textColor: 'danger700' };
    default:
      return { background: 'neutral100', textColor: 'neutral700' };
  }
};

export const getLatestRejectionReason = (comments?: Comment[]): string | null => {
  if (!comments || comments.length === 0) return null;

  const rejectionComments = comments
    .filter((c) => c.commentType === 'rejection')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return rejectionComments[0]?.content || null;
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
