import React from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '@strapi/strapi/admin';
import { useParams, useSearchParams } from 'react-router-dom';
import { useReviewStatusQuery, usePluginConfig } from '../../api';
import { useIsContentTypeEnabled, useFieldCommentPortals } from '../../hooks';
import { FieldCommentButton } from './FieldCommentButton';
import { FieldCommentDisplay } from './FieldCommentDisplay';

export const FieldCommentOverlay = () => {
  const params = useParams<{ id: string; slug: string; status: 'published' | 'draft' }>();
  const [searchParams] = useSearchParams();
  const { data: config } = usePluginConfig();
  const locale = searchParams.get('plugins[i18n][locale]') || config?.defaultLocale || 'en';
  const { user } = useAuth('FieldCommentOverlay', (state) => state);
  const { isEnabled } = useIsContentTypeEnabled(params.slug || '');

  const { data: review } = useReviewStatusQuery(params.slug, params.id, locale, {
    enabled: isEnabled,
  });

  const isReviewer = Boolean(user && review?.assignedTo?.id === user.id);
  const isRequester = Boolean(user && review?.assignedBy?.id === user.id);
  const isPending = review?.status === 'pending';
  const isRejected = review?.status === 'rejected';
  // Overlay is active for both pending and rejected states
  const isActive = isPending || isRejected;

  // Only show add button (and delete button) while review is still pending
  const canAddComments = isPending && isReviewer;
  // Requester can resolve/unresolve in either state
  const canResolve = isRequester;

  const portalTargets = useFieldCommentPortals({
    isEnabled,
    isActive,
    canAddComments,
    isReviewer,
    isRequester,
    review,
  });

  if (!isEnabled || !review || !isActive || (!isReviewer && !isRequester)) {
    return null;
  }

  return (
    <>
      {portalTargets.map(({ fieldName, buttonMount, displayMount }) => (
        <React.Fragment key={fieldName}>
          {canAddComments &&
            buttonMount &&
            ReactDOM.createPortal(
              <FieldCommentButton
                fieldName={fieldName}
                reviewDocumentId={review.documentId}
                locale={locale}
              />,
              buttonMount
            )}
          {displayMount &&
            ReactDOM.createPortal(
              <FieldCommentDisplay
                fieldName={fieldName}
                comments={review.comments || []}
                canResolve={canResolve}
                canDelete={canAddComments}
                currentUserId={user?.id}
              />,
              displayMount
            )}
        </React.Fragment>
      ))}
    </>
  );
};
