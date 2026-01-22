import { Box, Typography, Badge, Flex, Button } from '@strapi/design-system';
import {
  useFetchClient,
  useNotification,
  useAPIErrorHandler,
  FetchError,
  useAuth,
} from '@strapi/strapi/admin';
import React, { useState, useEffect, Fragment, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { CheckCircle, Cross } from '@strapi/icons';
import { PLUGIN_ID } from '../../pluginId';
import {
  getStatusBackground,
  getStatusTextColor,
  getStatusString,
  getStatusBadgeText,
} from '../../utils/utils';
import { reviewStatusEvents } from '../../utils/reviewStatusEvents';
import { getTranslation } from '../../utils/getTranslation';

export const ReviewStatus = () => {
  const intl = useIntl();
  const [review, setReview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleReject = async () => {
    if (!review?.documentId) return;

    setIsSubmitting(true);
    try {
      await put(`/${PLUGIN_ID}/reject/${review.documentId}/${review.locale}`, {});
      toggleNotification({
        type: 'success',
        message: intl.formatMessage({
          id: getTranslation('notification.review.rejected'),
          defaultMessage: 'Review rejected successfully',
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

  if (isLoading || !review) {
    return null;
  }

  const isAssignedReviewer = user && review.assignedTo?.id === user.id;
  const isPending = review.status === 'pending';
  const showApproveRejectButtons = isAssignedReviewer && isPending;

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
        <Flex direction="column" gap={2}>
          <Flex gap={2} alignItems="center">
            <Badge
              background={getStatusBackground(review.status)}
              textColor={getStatusTextColor(review.status)}
            >
              {getStatusBadgeText(intl, review.status)}
            </Badge>
          </Flex>
          {review.assignedTo && (
            <Typography variant="pi" textColor="neutral600">
              {getStatusString(intl, review.status)}
              {review.assignedTo.firstname} {review.assignedTo.lastname}
            </Typography>
          )}
          {review.status !== 'approved' && review.comments && (
            <Box marginTop={2}>
              <Typography variant="pi" textColor="neutral600">
                <FormattedMessage
                  id={getTranslation('review.comments')}
                  defaultMessage="Comments"
                />
                : {review.comments}
              </Typography>
            </Box>
          )}
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
                onClick={handleReject}
                loading={isSubmitting}
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
        </Flex>
      </Box>
    </Fragment>
  );
};
