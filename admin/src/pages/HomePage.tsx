import { useCallback } from 'react';
import { Page, Layouts } from '@strapi/strapi/admin';
import { Box, Typography, Flex, Badge, Tabs } from '@strapi/design-system';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { getTranslation } from '../utils/getTranslation';
import { getEditUrl } from '../utils/formatters';
import { useReviews, useReviewModals } from '../hooks';
import { AssignedToMeTable, RejectedByMeTable, AssignedByMeTable } from '../components/TaskCenter';
import { RejectReasonModal, ReRequestModal } from '../components/modals';
import type { Review } from '../types/review';

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
  } = useReviews();

  const {
    rejectModalOpen,
    selectedReviewForReject,
    reRequestModalOpen,
    selectedReviewForReRequest,
    openRejectModal,
    closeRejectModal,
    openReRequestModal,
    closeReRequestModal,
  } = useReviewModals();

  const handleApprove = useCallback(
    async (e: React.MouseEvent, reviewId: string, locale: string) => {
      e.stopPropagation();
      await approveReview(reviewId, locale);
    },
    [approveReview]
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
          defaultMessage: 'Task Center',
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
                {(pendingCount > 0 || rejectedCount > 0) && (
                  <Badge marginLeft={2} active>
                    {pendingCount + rejectedCount}
                  </Badge>
                )}
              </Tabs.Trigger>
              <Tabs.Trigger value="assigned-by-me">
                <FormattedMessage
                  id={getTranslation('taskCenter.tabs.assignedByMe')}
                  defaultMessage="Assigned by Me"
                />
                {assignedByMeCount > 0 && <Badge marginLeft={2}>{assignedByMeCount}</Badge>}
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
                  {/* Pending Reviews Section */}
                  <Typography variant="beta" as="h2" marginBottom={2}>
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
                    onApprove={handleApprove}
                    onReject={openRejectModal}
                  />

                  {/* Rejected Reviews Section */}
                  <Flex
                    gap={2}
                    direction="column"
                    alignItems="stretch"
                    justifyContent="flex-start"
                    marginTop={6}
                  >
                    <Typography variant="beta" as="h2" marginBottom={2}>
                      <FormattedMessage
                        id={getTranslation('taskCenter.rejected.title')}
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
              <Tabs.Content value="assigned-by-me">
                <Flex
                  padding={4}
                  gap={2}
                  direction="column"
                  alignItems="stretch"
                  justifyContent="flex-start"
                >
                  <Typography variant="beta" as="h2" marginBottom={4}>
                    <FormattedMessage
                      id={getTranslation('taskCenter.assignedByMe.title')}
                      defaultMessage="Reviews You've Requested"
                    />
                  </Typography>
                  <Typography variant="omega" textColor="neutral600" marginBottom={6}>
                    <FormattedMessage
                      id={getTranslation('taskCenter.assignedByMe.description')}
                      defaultMessage="Track the status of reviews you've assigned to others. Click on a row to view the document."
                    />
                  </Typography>
                  <AssignedByMeTable
                    reviews={assignedByMeReviews}
                    isLoading={isLoadingAssignedByMe}
                    onRowClick={handleRowClick}
                    onReRequest={openReRequestModal}
                  />
                </Flex>
              </Tabs.Content>
            </Box>
          </Tabs.Root>
        </Box>
      </Layouts.Content>

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
