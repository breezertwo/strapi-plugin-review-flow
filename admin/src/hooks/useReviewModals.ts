import { useState, useCallback } from 'react';
import type { Review } from '../types/review';

interface UseReviewModalsReturn {
  rejectModalOpen: boolean;
  selectedReviewForReject: Review | null;
  reRequestModalOpen: boolean;
  selectedReviewForReRequest: Review | null;
  openRejectModal: (e: React.MouseEvent, review: Review) => void;
  closeRejectModal: () => void;
  openReRequestModal: (e: React.MouseEvent, review: Review) => void;
  closeReRequestModal: () => void;
}

export const useReviewModals = (): UseReviewModalsReturn => {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedReviewForReject, setSelectedReviewForReject] = useState<Review | null>(null);
  const [reRequestModalOpen, setReRequestModalOpen] = useState(false);
  const [selectedReviewForReRequest, setSelectedReviewForReRequest] = useState<Review | null>(null);

  const openRejectModal = useCallback((e: React.MouseEvent, review: Review) => {
    e.stopPropagation();
    setSelectedReviewForReject(review);
    setRejectModalOpen(true);
  }, []);

  const closeRejectModal = useCallback(() => {
    setRejectModalOpen(false);
    setSelectedReviewForReject(null);
  }, []);

  const openReRequestModal = useCallback((e: React.MouseEvent, review: Review) => {
    e.stopPropagation();
    setSelectedReviewForReRequest(review);
    setReRequestModalOpen(true);
  }, []);

  const closeReRequestModal = useCallback(() => {
    setReRequestModalOpen(false);
    setSelectedReviewForReRequest(null);
  }, []);

  return {
    rejectModalOpen,
    selectedReviewForReject,
    reRequestModalOpen,
    selectedReviewForReRequest,
    openRejectModal,
    closeRejectModal,
    openReRequestModal,
    closeReRequestModal,
  };
};
