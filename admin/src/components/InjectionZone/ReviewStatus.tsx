import { Box, Typography, Badge, Flex } from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';
import React, { useState, useEffect, Fragment, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
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

  if (isLoading || !review) {
    return null;
  }

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
                Comments: {review.comments}
              </Typography>
            </Box>
          )}
        </Flex>
      </Box>
    </Fragment>
  );
};
