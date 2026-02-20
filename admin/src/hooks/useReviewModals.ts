import { useState, useCallback } from 'react';
import type { Review, ReviewGroup } from '../types/review';

interface UseReviewModalsReturn {
  // Reject (single-locale, used by ReviewStatus sidebar)
  rejectModalOpen: boolean;
  selectedReviewForReject: Review | null;
  openRejectModal: (e: React.MouseEvent, review: Review) => void;
  closeRejectModal: () => void;
  // Reject group (multi-locale, used by Task Center)
  rejectGroupModalGroup: ReviewGroup | null;
  openRejectGroupModal: (group: ReviewGroup) => void;
  closeRejectGroupModal: () => void;
  // Re-request
  reRequestModalOpen: boolean;
  selectedReviewForReRequest: Review | null;
  openReRequestModal: (e: React.MouseEvent, review: Review) => void;
  closeReRequestModal: () => void;
  // Approve group
  approveModalGroup: ReviewGroup | null;
  openApproveModal: (group: ReviewGroup) => void;
  closeApproveModal: () => void;
}

export const useReviewModals = (): UseReviewModalsReturn => {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedReviewForReject, setSelectedReviewForReject] = useState<Review | null>(null);

  const [rejectGroupModalGroup, setRejectGroupModalGroup] = useState<ReviewGroup | null>(null);

  const [reRequestModalOpen, setReRequestModalOpen] = useState(false);
  const [selectedReviewForReRequest, setSelectedReviewForReRequest] = useState<Review | null>(null);

  const [approveModalGroup, setApproveModalGroup] = useState<ReviewGroup | null>(null);

  const openRejectModal = useCallback((e: React.MouseEvent, review: Review) => {
    setSelectedReviewForReject(review);
    setRejectModalOpen(true);
  }, []);

  const closeRejectModal = useCallback(() => {
    setRejectModalOpen(false);
    setSelectedReviewForReject(null);
  }, []);

  const openRejectGroupModal = useCallback((group: ReviewGroup) => {
    setRejectGroupModalGroup(group);
  }, []);

  const closeRejectGroupModal = useCallback(() => {
    setRejectGroupModalGroup(null);
  }, []);

  const openReRequestModal = useCallback((e: React.MouseEvent, review: Review) => {
    setSelectedReviewForReRequest(review);
    setReRequestModalOpen(true);
  }, []);

  const closeReRequestModal = useCallback(() => {
    setReRequestModalOpen(false);
    setSelectedReviewForReRequest(null);
  }, []);

  const openApproveModal = useCallback((group: ReviewGroup) => {
    setApproveModalGroup(group);
  }, []);

  const closeApproveModal = useCallback(() => {
    setApproveModalGroup(null);
  }, []);

  return {
    rejectModalOpen,
    selectedReviewForReject,
    openRejectModal,
    closeRejectModal,
    rejectGroupModalGroup,
    openRejectGroupModal,
    closeRejectGroupModal,
    reRequestModalOpen,
    selectedReviewForReRequest,
    openReRequestModal,
    closeReRequestModal,
    approveModalGroup,
    openApproveModal,
    closeApproveModal,
  };
};
