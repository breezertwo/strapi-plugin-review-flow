import { Box, Typography, Badge, Flex, Button } from '@strapi/design-system';
import {
  useFetchClient,
  useNotification,
  useAPIErrorHandler,
  FetchError,
  useAuth,
} from '@strapi/strapi/admin';
import React, { useState, useEffect, Fragment, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { CheckCircle, Cross, ArrowClockwise } from '@strapi/icons';
import { PLUGIN_ID } from '../../pluginId';
import {
  getStatusBackground,
  getStatusTextColor,
  getStatusString,
  getStatusBadgeText,
} from '../../utils/utils';
import { reviewStatusEvents } from '../../utils/reviewStatusEvents';
import { getTranslation } from '../../utils/getTranslation';
import { CommentHistory } from '../CommentHistory';
import { RejectReasonModal, ReRequestModal } from '../modals';

export const ReviewStatus = () => {
  const intl = useIntl();
  const [review, setReview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReRequestModal, setShowReRequestModal] = useState(false);
  const { get, put } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { formatAPIError } = useAPIErrorHandler();
  const params = useParams<{ id: string; slug: string }>();
  const [searchParams] = useSearchParams();
  const locale = searchParams.get('plugins[i18n][locale]') || 'en';
  const { user } = useAuth('ReviewStatus', (state) => state);

  const fetchReviewStatus = useCallback(async () => {
    if (!params.id || !params.slug) return;

    try {
      setIsLoading(true);
      const { data } = await get(`/${PLUGIN_ID}/status/${params.slug}/${params.id}/${locale}`);
      setReview(data.data);
    } catch (error) {
      setReview(null);
    } finally {
      setIsLoading(false);
    }
  }, [params.id, params.slug, locale, get]);

  useEffect(() => {
    fetchReviewStatus();
  }, [fetchReviewStatus]);

  useEffect(() => {
    const unsubscribe = reviewStatusEvents.subscribe(() => {
      fetchReviewStatus();
    });
    return unsubscribe;
  }, [fetchReviewStatus]);

  const handleApprove = async () => {
    if (!review?.documentId) return;

    setIsSubmitting(true);
    try {
      await put(`/${PLUGIN_ID}/approve/${review.documentId}/${review.locale}`, {});
      toggleNotification({
        type: 'success',
        message: intl.formatMessage({
          id: getTranslation('notification.review.approved'),
          defaultMessage: 'Review approved successfully',
        }),
      });
      fetchReviewStatus();
      reviewStatusEvents.emit();
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(error as FetchError),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectClick = () => {
    setShowRejectModal(true);
  };

  const handleRejectModalClose = () => {
    setShowRejectModal(false);
  };

  const handleRejectSuccess = () => {
    fetchReviewStatus();
  };

  const handleReRequestClick = () => {
    setShowReRequestModal(true);
  };

  const handleReRequestModalClose = () => {
    setShowReRequestModal(false);
  };

  const handleReRequestSuccess = () => {
    fetchReviewStatus();
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
  }, [review, intl]);

  if (isLoading || !review) {
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
                loading={isSubmitting}
                disabled={isSubmitting}
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
                onClick={handleRejectClick}
                disabled={isSubmitting}
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
                onClick={handleReRequestClick}
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
          onClose={handleRejectModalClose}
          onSuccess={handleRejectSuccess}
        />
      )}

      {/* Re-Request Modal */}
      {showReRequestModal && (
        <ReRequestModal
          reviewId={review.documentId}
          locale={review.locale}
          onClose={handleReRequestModalClose}
          onSuccess={handleReRequestSuccess}
        />
      )}
    </Fragment>
  );
};
