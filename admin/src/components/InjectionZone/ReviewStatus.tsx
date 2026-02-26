import { Box, Typography, Badge, Flex, Button } from '@strapi/design-system';
import { useAuth } from '@strapi/strapi/admin';
import React, { useState, Fragment, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { CheckCircle, Cross, ArrowClockwise } from '@strapi/icons';
import {
  getStatusBackground,
  getStatusTextColor,
  getStatusString,
  getStatusBadgeText,
} from '../../utils/utils';
import { getTranslation } from '../../utils/getTranslation';
import { CommentHistory } from '../CommentHistory';
import { RejectReasonModal, ReRequestModal } from '../modals';
import { useReviewStatusQuery, useApproveMutation } from '../../api';
import { useIsContentTypeEnabled } from '../../hooks/useIsContentTypeEnabled';

export const ReviewStatus = () => {
  const intl = useIntl();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReRequestModal, setShowReRequestModal] = useState(false);
  const params = useParams<{ id: string; slug: string }>();
  const [searchParams] = useSearchParams();
  const locale = searchParams.get('plugins[i18n][locale]') || 'en';
  const { user } = useAuth('ReviewStatus', (state) => state);

  const { isEnabled } = useIsContentTypeEnabled(params.slug || '');
  const { data: review, isLoading } = useReviewStatusQuery(params.slug, params.id, locale);
  const approveMutation = useApproveMutation();

  const handleApprove = async () => {
    if (!review?.documentId) return;
    await approveMutation.mutateAsync({ reviewId: review.documentId, locale: review.locale });
  };

  const commentsWithApproval = useMemo(() => {
    if (!review || !review.comments || isLoading) return [];
    if (review.status === 'approved' && review.reviewedAt) {
      const syntheticApproval = {
        id: -1,
        documentId: `synthetic-approval-${review.documentId}`,
        content: intl.formatMessage({
          id: getTranslation('commentHistory.approvalMessage'),
          defaultMessage: 'Review approved',
        }),
        commentType: 'approval' as const,
        createdAt: review.reviewedAt,
        author: review.assignedTo,
      };

      return [syntheticApproval, ...review.comments];
    }

    return review.comments;
  }, [review, intl, isLoading]);

  if (!isEnabled || isLoading || !review) {
    return null;
  }

  const isAssignedReviewer = user && review.assignedTo?.id === user.id;
  const isAssigner = user && review.assignedBy?.id === user.id;
  const isPending = review.status === 'pending';
  const isRejected = review.status === 'rejected';
  const showApproveRejectButtons = isAssignedReviewer && isPending;
  const showReRequestButton = isAssigner && isRejected;

  return (
    <Fragment>
      <Typography
        variant="sigma"
        textColor="neutral600"
        style={{
          alignSelf: 'flex-start',
          marginTop: '1rem',
          marginBottom: '4px',
        }}
      >
        <FormattedMessage
          id={getTranslation('editview.section.header')}
          defaultMessage="Review Info"
        />
      </Typography>
      <Box
        padding={4}
        background="neutral100"
        hasRadius
        style={{
          alignSelf: 'stretch',
        }}
      >
        <Flex direction="column" gap={3}>
          {/* Status Badge */}
          <Flex gap={2} alignItems="center">
            <Badge
              background={getStatusBackground(review.status)}
              textColor={getStatusTextColor(review.status)}
            >
              {getStatusBadgeText(intl, review.status)}
            </Badge>
          </Flex>

          {/* Assigned To Info */}
          {review.assignedTo && (
            <Typography variant="pi" textColor="neutral600">
              {getStatusString(intl, review.status)}
              {review.assignedTo.firstname} {review.assignedTo.lastname}
            </Typography>
          )}

          {/* Approve/Reject Buttons (for assigned reviewer when pending) */}
          {showApproveRejectButtons && (
            <Flex gap={2} marginTop={2} wrap="wrap">
              <Button
                startIcon={<CheckCircle />}
                padding={1}
                variant="success"
                onClick={handleApprove}
                loading={approveMutation.isPending}
                disabled={approveMutation.isPending}
                style={{ flexGrow: 1 }}
              >
                <FormattedMessage
                  id={getTranslation('review.button.approve')}
                  defaultMessage="Approve"
                />
              </Button>
              <Button
                startIcon={<Cross />}
                padding={1}
                variant="danger"
                onClick={() => setShowRejectModal(true)}
                disabled={approveMutation.isPending}
                style={{ flexGrow: 1 }}
              >
                <FormattedMessage
                  id={getTranslation('review.button.reject')}
                  defaultMessage="Reject"
                />
              </Button>
            </Flex>
          )}

          {/* Re-request Button (for assigner when rejected) */}
          {showReRequestButton && (
            <Flex marginTop={2}>
              <Button
                startIcon={<ArrowClockwise />}
                padding={1}
                variant="default"
                onClick={() => setShowReRequestModal(true)}
                style={{ flexGrow: 1 }}
              >
                <FormattedMessage
                  id={getTranslation('review.button.reRequest')}
                  defaultMessage="Re-request Review"
                />
              </Button>
            </Flex>
          )}

          {/* Comment History */}
          {commentsWithApproval && commentsWithApproval.length > 0 && (
            <Flex
              marginTop={3}
              direction="column"
              alignItems="flex-start"
              style={{ alignSelf: 'stretch' }}
            >
              <CommentHistory comments={commentsWithApproval} />
            </Flex>
          )}
        </Flex>
      </Box>

      {/* Reject Modal */}
      {showRejectModal && (
        <RejectReasonModal
          reviewId={review.documentId}
          locale={review.locale}
          onClose={() => setShowRejectModal(false)}
        />
      )}

      {/* Re-Request Modal */}
      {showReRequestModal && (
        <ReRequestModal
          reviewId={review.documentId}
          locale={review.locale}
          onClose={() => setShowReRequestModal(false)}
        />
      )}
    </Fragment>
  );
};
