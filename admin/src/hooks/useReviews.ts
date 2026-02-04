import { useState, useCallback, useEffect } from 'react';
import { useNotification, useAPIErrorHandler, FetchError } from '@strapi/strapi/admin';
import { useFetchClient } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { PLUGIN_ID } from '../pluginId';
import { getTranslation } from '../utils/getTranslation';
import type { Review } from '../types/review';

interface UseReviewsReturn {
  assignedToMeReviews: Review[];
  rejectedByMeReviews: Review[];
  assignedByMeReviews: Review[];
  isLoadingAssignedToMe: boolean;
  isLoadingRejectedByMe: boolean;
  isLoadingAssignedByMe: boolean;
  refetchAll: () => void;
  approveReview: (reviewId: string, locale: string) => Promise<boolean>;
}

export const useReviews = (): UseReviewsReturn => {
  const [assignedToMeReviews, setAssignedToMeReviews] = useState<Review[]>([]);
  const [rejectedByMeReviews, setRejectedByMeReviews] = useState<Review[]>([]);
  const [assignedByMeReviews, setAssignedByMeReviews] = useState<Review[]>([]);
  const [isLoadingAssignedToMe, setIsLoadingAssignedToMe] = useState(true);
  const [isLoadingRejectedByMe, setIsLoadingRejectedByMe] = useState(true);
  const [isLoadingAssignedByMe, setIsLoadingAssignedByMe] = useState(true);

  const { get, put } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { formatAPIError } = useAPIErrorHandler();
  const intl = useIntl();

  const fetchAssignedToMeReviews = useCallback(async () => {
    try {
      setIsLoadingAssignedToMe(true);
      const { data } = await get(`/${PLUGIN_ID}/pending`);
      setAssignedToMeReviews(data.data || []);
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(error as FetchError),
      });
    } finally {
      setIsLoadingAssignedToMe(false);
    }
  }, [get, toggleNotification, formatAPIError]);

  const fetchRejectedByMeReviews = useCallback(async () => {
    try {
      setIsLoadingRejectedByMe(true);
      const { data } = await get(`/${PLUGIN_ID}/rejected`);
      setRejectedByMeReviews(data.data || []);
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(error as FetchError),
      });
    } finally {
      setIsLoadingRejectedByMe(false);
    }
  }, [get, toggleNotification, formatAPIError]);

  const fetchAssignedByMeReviews = useCallback(async () => {
    try {
      setIsLoadingAssignedByMe(true);
      const { data } = await get(`/${PLUGIN_ID}/assigned-by-me`);
      setAssignedByMeReviews(data.data || []);
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(error as FetchError),
      });
    } finally {
      setIsLoadingAssignedByMe(false);
    }
  }, [get, toggleNotification, formatAPIError]);

  const refetchAll = useCallback(() => {
    fetchAssignedToMeReviews();
    fetchRejectedByMeReviews();
    fetchAssignedByMeReviews();
  }, [fetchAssignedToMeReviews, fetchRejectedByMeReviews, fetchAssignedByMeReviews]);

  const approveReview = useCallback(
    async (reviewId: string, locale: string): Promise<boolean> => {
      try {
        await put(`/${PLUGIN_ID}/approve/${reviewId}/${locale}`, {});
        toggleNotification({
          type: 'success',
          message: intl.formatMessage({
            id: getTranslation('notification.review.approved'),
            defaultMessage: 'Review approved successfully',
          }),
        });
        refetchAll();
        return true;
      } catch (error) {
        toggleNotification({
          type: 'danger',
          message: formatAPIError(error as FetchError),
        });
        return false;
      }
    },
    [put, toggleNotification, formatAPIError, intl, refetchAll]
  );

  useEffect(() => {
    refetchAll();
  }, [refetchAll]);

  return {
    assignedToMeReviews,
    rejectedByMeReviews,
    assignedByMeReviews,
    isLoadingAssignedToMe,
    isLoadingRejectedByMe,
    isLoadingAssignedByMe,
    refetchAll,
    approveReview,
  };
};
