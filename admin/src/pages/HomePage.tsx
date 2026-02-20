import React, { useCallback } from 'react';
import { Page, Layouts } from '@strapi/strapi/admin';
import { Box, Typography, Flex, Badge, Tabs } from '@strapi/design-system';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { getTranslation } from '../utils/getTranslation';
import { getEditUrl } from '../utils/formatters';
import { useReviews, useReviewModals } from '../hooks';
import {
  AssignedToMeTable,
  RejectedByMeTable,
  AssignedByMeTable,
  RejectedAssignedByMeTable,
} from '../components/TaskCenter';
import {
  RejectReasonModal,
  ReRequestModal,
  ApproveModal,
  RejectGroupModal,
} from '../components/modals';
import type { Review, ReviewGroup } from '../types/review';

export const HomePage = () => {
  const intl = useIntl();
  const navigate = useNavigate();

  const {
    assignedToMeReviews,
    rejectedByMeReviews,
    assignedByMeReviews,
    isLoadingAssignedToMe,
    isLoadingRejectedByMe,
    isLoadingAssignedByMe,
    refetchAll,
    approveReview,
    rejectReview,
  } = useReviews();

  const {
    rejectModalOpen,
    selectedReviewForReject,
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
  } = useReviewModals();

  const handleApproveClick = useCallback(
    (group: ReviewGroup) => {
      openApproveModal(group);
    },
    [openApproveModal]
  );

  const handleRejectClick = useCallback(
    (e: React.MouseEvent, group: ReviewGroup) => {
      openRejectGroupModal(group);
    },
    [openRejectGroupModal]
  );

  const handleRowClick = useCallback(
    (review: Review) => {
      const editUrl = getEditUrl(
        review.assignedContentType,
        review.assignedDocumentId,
        review.locale
      );
      navigate(editUrl);
    },
    [navigate]
  );

  const pendingCount = assignedToMeReviews.length;
  const rejectedCount = rejectedByMeReviews.length;

  const pendingAssignedByMe = assignedByMeReviews.filter((r) => r.status === 'pending');
  const rejectedAssignedByMe = assignedByMeReviews.filter((r) => r.status === 'rejected');
  const assignedByMeCount = assignedByMeReviews.length;

  return (
    <Page.Main>
      <Page.Title>
        {intl.formatMessage({
          id: getTranslation('taskCenter.pageTitle'),
          defaultMessage: 'Review Workflow - Task Center',
        })}
      </Page.Title>
      <Layouts.Header
        title={intl.formatMessage({
          id: getTranslation('taskCenter.header.title'),
          defaultMessage: 'Review Task Center',
        })}
        subtitle={intl.formatMessage({
          id: getTranslation('taskCenter.header.subtitle'),
          defaultMessage: "Manage your review tasks and track reviews you've assigned",
        })}
      />
      <Layouts.Content>
        <Box padding={6} background="neutral0" hasRadius shadow="filterShadow">
          <Tabs.Root variant="simple" defaultValue="assigned-to-me">
            <Tabs.List aria-label="Review tabs">
              <Tabs.Trigger value="assigned-to-me">
                <FormattedMessage
                  id={getTranslation('taskCenter.tabs.assignedToMe')}
                  defaultMessage="Assigned to Me"
                />
                {pendingCount + rejectedAssignedByMe.length > 0 && (
                  <Badge marginLeft={2} active>
                    {pendingCount + rejectedAssignedByMe.length}
                  </Badge>
                )}
              </Tabs.Trigger>
              <Tabs.Trigger value="assigned-by-me">
                <FormattedMessage
                  id={getTranslation('taskCenter.tabs.assignedByMe')}
                  defaultMessage="Assigned by Me"
                />
                {pendingAssignedByMe.length + rejectedCount > 0 && (
                  <Badge marginLeft={2}>{pendingAssignedByMe.length + rejectedCount}</Badge>
                )}
              </Tabs.Trigger>
            </Tabs.List>
            <Box paddingTop={4}>
              <Tabs.Content value="assigned-to-me">
                <Flex
                  padding={4}
                  gap={2}
                  direction="column"
                  alignItems="stretch"
                  justifyContent="flex-start"
                >
                  <Typography variant="beta" as="h2">
                    <FormattedMessage
                      id={getTranslation('taskCenter.assignedToMe.title')}
                      defaultMessage="Reviews Waiting for Your Approval"
                    />
                  </Typography>
                  <Typography variant="omega" textColor="neutral600" marginBottom={4}>
                    <FormattedMessage
                      id={getTranslation('taskCenter.assignedToMe.description')}
                      defaultMessage="These documents have been assigned to you for review. Click on a row to view the document."
                    />
                  </Typography>
                  <AssignedToMeTable
                    reviews={assignedToMeReviews}
                    isLoading={isLoadingAssignedToMe}
                    onRowClick={handleRowClick}
                    onApproveClick={handleApproveClick}
                    onReject={handleRejectClick}
                  />

                  <Flex
                    gap={2}
                    direction="column"
                    alignItems="stretch"
                    justifyContent="flex-start"
                    marginTop={6}
                  >
                    <Typography variant="beta" as="h2">
                      <FormattedMessage
                        id={getTranslation('taskCenter.rejected.title')}
                        defaultMessage="Rejected Reviews"
                      />
                    </Typography>
                    <Typography variant="omega" textColor="neutral600" marginBottom={4}>
                      <FormattedMessage
                        id={getTranslation('taskCenter.assignedByMe.rejectedDescription')}
                        defaultMessage="These reviews were rejected by the reviewer. Update the content and re-request the review."
                      />
                    </Typography>
                    <RejectedAssignedByMeTable
                      reviews={rejectedAssignedByMe}
                      isLoading={isLoadingAssignedByMe}
                      onRowClick={handleRowClick}
                      onReRequest={openReRequestModal}
                    />
                  </Flex>
                </Flex>
              </Tabs.Content>
              <Tabs.Content value="assigned-by-me">
                <Flex
                  padding={4}
                  gap={2}
                  direction="column"
                  alignItems="stretch"
                  justifyContent="flex-start"
                >
                  <Typography variant="beta" as="h2">
                    <FormattedMessage
                      id={getTranslation('taskCenter.assignedByMe.pendingTitle')}
                      defaultMessage="Awaiting Review"
                    />
                  </Typography>
                  <Typography variant="omega" textColor="neutral600" marginBottom={4}>
                    <FormattedMessage
                      id={getTranslation('taskCenter.assignedByMe.pendingDescription')}
                      defaultMessage="Reviews you've requested that are waiting for the reviewer's decision."
                    />
                  </Typography>
                  <AssignedByMeTable
                    reviews={pendingAssignedByMe}
                    isLoading={isLoadingAssignedByMe}
                    onRowClick={handleRowClick}
                  />

                  <Flex
                    gap={2}
                    direction="column"
                    alignItems="stretch"
                    justifyContent="flex-start"
                    marginTop={6}
                  >
                    <Typography variant="beta" as="h2">
                      <FormattedMessage
                        id={getTranslation('taskCenter.assignedByMe.rejectedTitle')}
                        defaultMessage="Rejected Reviews"
                      />
                    </Typography>
                    <Typography variant="omega" textColor="neutral600" marginBottom={4}>
                      <FormattedMessage
                        id={getTranslation('taskCenter.rejected.description')}
                        defaultMessage="Reviews you rejected. The requester may re-submit with changes."
                      />
                    </Typography>

                    <RejectedByMeTable
                      reviews={rejectedByMeReviews}
                      isLoading={isLoadingRejectedByMe}
                      onRowClick={handleRowClick}
                    />
                  </Flex>
                </Flex>
              </Tabs.Content>
            </Box>
          </Tabs.Root>
        </Box>
      </Layouts.Content>

      {/* Reject Group Modal */}
      {rejectGroupModalGroup && (
        <RejectGroupModal
          group={rejectGroupModalGroup}
          onClose={closeRejectGroupModal}
          onRejectLocale={rejectReview}
        />
      )}

      {/* Approve Modal */}
      {approveModalGroup && (
        <ApproveModal
          group={approveModalGroup}
          onClose={closeApproveModal}
          onApproveLocale={approveReview}
        />
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedReviewForReject && (
        <RejectReasonModal
          reviewId={selectedReviewForReject.documentId}
          locale={selectedReviewForReject.locale}
          onClose={closeRejectModal}
          onSuccess={refetchAll}
        />
      )}

      {/* Re-Request Modal */}
      {reRequestModalOpen && selectedReviewForReRequest && (
        <ReRequestModal
          reviewId={selectedReviewForReRequest.documentId}
          locale={selectedReviewForReRequest.locale}
          onClose={closeReRequestModal}
          onSuccess={refetchAll}
        />
      )}
    </Page.Main>
  );
};
