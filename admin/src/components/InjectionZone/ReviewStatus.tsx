import React, { useState, useEffect, Fragment, useCallback } from 'react';
import { Box, Typography, Badge, Flex } from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';
import { useParams, useSearchParams } from 'react-router-dom';
import { PLUGIN_ID } from '../../pluginId';
import { getStatusBackground, getStatusText } from '../../utils/colors';
import { reviewStatusEvents } from '../../utils/reviewStatusEvents';

export const ReviewStatus = () => {
  const [review, setReview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { get } = useFetchClient();
  const params = useParams<{ id: string; slug: string }>();
  const [searchParams] = useSearchParams();
  const locale = searchParams.get('plugins[i18n][locale]') || 'en';

  const fetchReviewStatus = useCallback(async () => {
    if (!params.id || !params.slug) return;

    try {
      setIsLoading(true);
      const { data } = await get(`/${PLUGIN_ID}/status/${params.slug}/${params.id}/${locale}`);
      setReview(data.data);
    } catch (error) {
      // Review not found is expected for new documents
      setReview(null);
    } finally {
      setIsLoading(false);
    }
  }, [params.id, params.slug, locale, get]);

  useEffect(() => {
    fetchReviewStatus();
  }, [fetchReviewStatus]);

  // Subscribe to refresh events (e.g., after a review is requested)
  useEffect(() => {
    const unsubscribe = reviewStatusEvents.subscribe(() => {
      fetchReviewStatus();
    });
    return unsubscribe;
  }, [fetchReviewStatus]);

  console.log('ReviewStatus', review);

  if (isLoading || !review) {
    return null;
  }
  const getStatusString = (status: string) => {
    console.log('getStatusString', status);
    switch (status) {
      case 'approved':
        return 'Approved by: ';
      case 'rejected':
        return 'Rejected by: ';
      case 'pending':
        return 'Assigned to: ';
      default:
        return '';
    }
  };

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
        Review Info
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
              textColor={getStatusText(review.status)}
            >
              {review.status.toUpperCase()}
            </Badge>
          </Flex>
          {review.assignedTo && (
            <Typography variant="pi" textColor="neutral600">
              {getStatusString(review.status)}
              {review.assignedTo.firstname} {review.assignedTo.lastname}
            </Typography>
          )}
          {review.status !== 'approved' && review.comments && (
            <Box marginTop={2}>
              <Typography variant="pi" textColor="neutral600">
                Comments: {review.comments}
              </Typography>
            </Box>
          )}
        </Flex>
      </Box>
    </Fragment>
  );
};
