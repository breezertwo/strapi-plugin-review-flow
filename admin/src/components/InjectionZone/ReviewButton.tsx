import { useState, useEffect, useCallback } from 'react';
import { Button } from '@strapi/design-system';
import { CheckCircle } from '@strapi/icons';
import { useFetchClient } from '@strapi/strapi/admin';
import { useParams, useSearchParams } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { ReviewModal } from './ReviewModal';
import { PLUGIN_ID } from '../../pluginId';
import { reviewStatusEvents } from '../../utils/reviewStatusEvents';
import { getTranslation } from '../../utils/getTranslation';

export const ReviewButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [review, setReview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { get } = useFetchClient();
  const params = useParams<{ id: string; slug: string }>();
  const [searchParams] = useSearchParams();
  const locale = searchParams.get('plugins[i18n][locale]') || 'en';

  const fetchReviewStatus = useCallback(async () => {
    if (!params.id || !params.slug) {
      setIsLoading(false);
      return;
    }

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

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (isLoading) {
    return null;
  }

  // Hide button if there's a pending or rejected review
  // Only show when no review exists or the review was approved
  if (review?.status === 'pending' || review?.status === 'rejected') {
    return null;
  }

  return (
    <>
      <Button
        style={{
          alignSelf: 'stretch',
          height: '3.2rem',
        }}
        startIcon={<CheckCircle />}
        onClick={handleOpenModal}
        variant="secondary"
      >
        <FormattedMessage
          id={getTranslation('editview.button.requestReview')}
          defaultMessage="Request review"
        />
      </Button>
      {isModalOpen && <ReviewModal onClose={handleCloseModal} />}
    </>
  );
};
