import React, { useState, useEffect, useCallback } from 'react';
import {
  Page,
  Layouts,
  useNotification,
  useAPIErrorHandler,
  FetchError,
} from '@strapi/strapi/admin';
import {
  Box,
  Typography,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Flex,
  Button,
  Tabs,
  Loader,
} from '@strapi/design-system';
import { CheckCircle, Cross, ArrowClockwise } from '@strapi/icons';
import { useFetchClient } from '@strapi/strapi/admin';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { PLUGIN_ID } from '../pluginId';
import { getTranslation } from '../utils/getTranslation';
import { RejectReasonModal } from '../components/RejectReasonModal';
import { ReRequestModal } from '../components/ReRequestModal';

interface Comment {
  id: number;
  documentId: string;
  content: string;
  commentType: 'assignment' | 'rejection' | 're-request' | 'approval' | 'general';
  createdAt: string;
  author?: {
    id: number;
    firstname?: string;
    lastname?: string;
  };
}

interface Review {
  documentId: string;
  assignedContentType: string;
  assignedDocumentId: string;
  locale: string;
  status: string;
  documentTitle?: string | null;
  reviewedAt?: string;
  assignedBy?: {
    id: number;
    firstname?: string;
    lastname?: string;
  };
  assignedTo?: {
    id: number;
    firstname?: string;
    lastname?: string;
  };
  createdAt?: string;
  comments?: Comment[];
}

const formatContentType = (contentType: string): string => {
  // Convert api::article.article to Article
  const parts = contentType.split('.');
  const name = parts[parts.length - 1];
  return name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
};

const getEditUrl = (contentType: string, documentId: string, locale: string): string => {
  // Convert api::article.article to collection-types/api::article.article
  return `/content-manager/collection-types/${contentType}/${documentId}?plugins[i18n][locale]=${locale}`;
};

const getStatusBadgeProps = (status: string): { background: string; textColor: string } => {
  switch (status) {
    case 'pending':
      return { background: 'warning100', textColor: 'warning700' };
    case 'approved':
      return { background: 'success100', textColor: 'success700' };
    case 'rejected':
      return { background: 'danger100', textColor: 'danger700' };
    default:
      return { background: 'neutral100', textColor: 'neutral700' };
  }
};

const getLatestRejectionReason = (comments?: Comment[]): string | null => {
  if (!comments || comments.length === 0) return null;

  const rejectionComments = comments
    .filter((c) => c.commentType === 'rejection')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return rejectionComments[0]?.content || null;
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const HomePage = () => {
  const intl = useIntl();
  const [assignedToMeReviews, setAssignedToMeReviews] = useState<Review[]>([]);
  const [rejectedByMeReviews, setRejectedByMeReviews] = useState<Review[]>([]);
  const [assignedByMeReviews, setAssignedByMeReviews] = useState<Review[]>([]);
  const [isLoadingAssignedToMe, setIsLoadingAssignedToMe] = useState(true);
  const [isLoadingRejectedByMe, setIsLoadingRejectedByMe] = useState(true);
  const [isLoadingAssignedByMe, setIsLoadingAssignedByMe] = useState(true);
  const [activeTab, setActiveTab] = useState('assigned-to-me');

  // Modal states
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedReviewForReject, setSelectedReviewForReject] = useState<Review | null>(null);
  const [reRequestModalOpen, setReRequestModalOpen] = useState(false);
  const [selectedReviewForReRequest, setSelectedReviewForReRequest] = useState<Review | null>(null);

  const { get, put } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { formatAPIError } = useAPIErrorHandler();
  const navigate = useNavigate();

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

  const fetchAllData = useCallback(() => {
    fetchAssignedToMeReviews();
    fetchRejectedByMeReviews();
    fetchAssignedByMeReviews();
  }, [fetchAssignedToMeReviews, fetchRejectedByMeReviews, fetchAssignedByMeReviews]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleApprove = async (e: React.MouseEvent, reviewId: string, locale: string) => {
    e.stopPropagation();
    try {
      await put(`/${PLUGIN_ID}/approve/${reviewId}/${locale}`, {});
      toggleNotification({
        type: 'success',
        message: intl.formatMessage({
          id: getTranslation('notification.review.approved'),
          defaultMessage: 'Review approved successfully',
        }),
      });
      fetchAllData();
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(error as FetchError),
      });
    }
  };

  const handleRejectClick = (e: React.MouseEvent, review: Review) => {
    e.stopPropagation();
    setSelectedReviewForReject(review);
    setRejectModalOpen(true);
  };

  const handleRejectModalClose = () => {
    setRejectModalOpen(false);
    setSelectedReviewForReject(null);
  };

  const handleRejectSuccess = () => {
    fetchAllData();
  };

  const handleReRequestClick = (e: React.MouseEvent, review: Review) => {
    e.stopPropagation();
    setSelectedReviewForReRequest(review);
    setReRequestModalOpen(true);
  };

  const handleReRequestModalClose = () => {
    setReRequestModalOpen(false);
    setSelectedReviewForReRequest(null);
  };

  const handleReRequestSuccess = () => {
    fetchAllData();
  };

  const handleRowClick = (review: Review) => {
    const editUrl = getEditUrl(
      review.assignedContentType,
      review.assignedDocumentId,
      review.locale
    );
    navigate(editUrl);
  };

  const renderAssignedToMePendingTable = () => {
    if (isLoadingAssignedToMe) {
      return (
        <Flex justifyContent="center" padding={8}>
          <Loader>
            <FormattedMessage
              id={getTranslation('taskCenter.loading')}
              defaultMessage="Loading reviews..."
            />
          </Loader>
        </Flex>
      );
    }

    if (assignedToMeReviews.length === 0) {
      return (
        <Box padding={8} textAlign="center">
          <Typography variant="delta" textColor="neutral600">
            <FormattedMessage
              id={getTranslation('taskCenter.assignedToMe.empty')}
              defaultMessage="No pending reviews assigned to you"
            />
          </Typography>
        </Box>
      );
    }

    return (
      <Table colCount={6} rowCount={assignedToMeReviews.length}>
        <Thead>
          <Tr>
            <Th>
              <Typography variant="sigma">
                <FormattedMessage
                  id={getTranslation('taskCenter.table.title')}
                  defaultMessage="Title"
                />
              </Typography>
            </Th>
            <Th>
              <Typography variant="sigma">
                <FormattedMessage
                  id={getTranslation('taskCenter.table.contentType')}
                  defaultMessage="Content Type"
                />
              </Typography>
            </Th>
            <Th>
              <Typography variant="sigma">
                <FormattedMessage
                  id={getTranslation('taskCenter.table.locale')}
                  defaultMessage="Locale"
                />
              </Typography>
            </Th>
            <Th>
              <Typography variant="sigma">
                <FormattedMessage
                  id={getTranslation('taskCenter.table.assignedBy')}
                  defaultMessage="Assigned By"
                />
              </Typography>
            </Th>
            <Th>
              <Typography variant="sigma">
                <FormattedMessage
                  id={getTranslation('taskCenter.table.status')}
                  defaultMessage="Status"
                />
              </Typography>
            </Th>
            <Th>
              <Typography variant="sigma">
                <FormattedMessage
                  id={getTranslation('taskCenter.table.actions')}
                  defaultMessage="Actions"
                />
              </Typography>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {assignedToMeReviews.map((review) => (
            <Tr
              key={`${review.documentId}-${review.locale}`}
              onClick={() => handleRowClick(review)}
              style={{ cursor: 'pointer' }}
            >
              <Td>
                <Typography fontWeight="bold">
                  {review.documentTitle || (
                    <em style={{ color: '#666' }}>
                      <FormattedMessage
                        id={getTranslation('taskCenter.table.untitled')}
                        defaultMessage="Untitled"
                      />
                    </em>
                  )}
                </Typography>
              </Td>
              <Td>
                <Typography>{formatContentType(review.assignedContentType)}</Typography>
              </Td>
              <Td>
                <Badge>{review.locale}</Badge>
              </Td>
              <Td>
                <Typography>
                  {review.assignedBy?.firstname} {review.assignedBy?.lastname}
                </Typography>
              </Td>
              <Td>
                <Badge active>{review.status}</Badge>
              </Td>
              <Td>
                <Flex gap={2}>
                  <Button
                    padding={1}
                    startIcon={<CheckCircle />}
                    variant="success"
                    onClick={(e: React.MouseEvent) =>
                      handleApprove(e, review.documentId, review.locale)
                    }
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
                    onClick={(e: React.MouseEvent) => handleRejectClick(e, review)}
                  >
                    <FormattedMessage
                      id={getTranslation('review.button.reject')}
                      defaultMessage="Reject"
                    />
                  </Button>
                </Flex>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    );
  };

  const renderRejectedByMeTable = () => {
    if (isLoadingRejectedByMe) {
      return (
        <Flex justifyContent="center" padding={8}>
          <Loader>
            <FormattedMessage
              id={getTranslation('taskCenter.loading')}
              defaultMessage="Loading reviews..."
            />
          </Loader>
        </Flex>
      );
    }

    if (rejectedByMeReviews.length === 0) {
      return (
        <Box padding={8} textAlign="center">
          <Typography variant="delta" textColor="neutral600">
            <FormattedMessage
              id={getTranslation('taskCenter.rejected.empty')}
              defaultMessage="No rejected reviews"
            />
          </Typography>
        </Box>
      );
    }

    return (
      <Table colCount={6} rowCount={rejectedByMeReviews.length}>
        <Thead>
          <Tr>
            <Th>
              <Typography variant="sigma">
                <FormattedMessage
                  id={getTranslation('taskCenter.table.title')}
                  defaultMessage="Title"
                />
              </Typography>
            </Th>
            <Th>
              <Typography variant="sigma">
                <FormattedMessage
                  id={getTranslation('taskCenter.table.contentType')}
                  defaultMessage="Content Type"
                />
              </Typography>
            </Th>
            <Th>
              <Typography variant="sigma">
                <FormattedMessage
                  id={getTranslation('taskCenter.table.locale')}
                  defaultMessage="Locale"
                />
              </Typography>
            </Th>
            <Th>
              <Typography variant="sigma">
                <FormattedMessage
                  id={getTranslation('taskCenter.table.rejectionReason')}
                  defaultMessage="Rejection Reason"
                />
              </Typography>
            </Th>
            <Th>
              <Typography variant="sigma">
                <FormattedMessage
                  id={getTranslation('taskCenter.table.rejectedAt')}
                  defaultMessage="Rejected At"
                />
              </Typography>
            </Th>
            <Th>
              <Typography variant="sigma">
                <FormattedMessage
                  id={getTranslation('taskCenter.table.assignedBy')}
                  defaultMessage="Assigned By"
                />
              </Typography>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {rejectedByMeReviews.map((review) => {
            const rejectionReason = getLatestRejectionReason(review.comments);

            return (
              <Tr
                key={`rejected-${review.documentId}-${review.locale}`}
                onClick={() => handleRowClick(review)}
                style={{ cursor: 'pointer' }}
              >
                <Td>
                  <Typography fontWeight="bold">
                    {review.documentTitle || (
                      <em style={{ color: '#666' }}>
                        <FormattedMessage
                          id={getTranslation('taskCenter.table.untitled')}
                          defaultMessage="Untitled"
                        />
                      </em>
                    )}
                  </Typography>
                </Td>
                <Td>
                  <Typography>{formatContentType(review.assignedContentType)}</Typography>
                </Td>
                <Td>
                  <Badge>{review.locale}</Badge>
                </Td>
                <Td>
                  <Typography
                    variant="omega"
                    textColor="neutral700"
                    style={{
                      maxWidth: '250px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={rejectionReason || undefined}
                  >
                    {rejectionReason || '-'}
                  </Typography>
                </Td>
                <Td>
                  <Typography variant="omega" textColor="neutral600">
                    {formatDate(review.reviewedAt)}
                  </Typography>
                </Td>
                <Td>
                  <Typography>
                    {review.assignedBy?.firstname} {review.assignedBy?.lastname}
                  </Typography>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    );
  };

  const renderAssignedByMeTable = () => {
    if (isLoadingAssignedByMe) {
      return (
        <Flex justifyContent="center" padding={8}>
          <Loader>
            <FormattedMessage
              id={getTranslation('taskCenter.loading')}
              defaultMessage="Loading reviews..."
            />
          </Loader>
        </Flex>
      );
    }

    if (assignedByMeReviews.length === 0) {
      return (
        <Box padding={8} textAlign="center">
          <Typography variant="delta" textColor="neutral600">
            <FormattedMessage
              id={getTranslation('taskCenter.assignedByMe.empty')}
              defaultMessage="No pending or rejected reviews assigned by you"
            />
          </Typography>
        </Box>
      );
    }

    return (
      <Table colCount={6} rowCount={assignedByMeReviews.length}>
        <Thead>
          <Tr>
            <Th>
              <Typography variant="sigma">
                <FormattedMessage
                  id={getTranslation('taskCenter.table.title')}
                  defaultMessage="Title"
                />
              </Typography>
            </Th>
            <Th>
              <Typography variant="sigma">
                <FormattedMessage
                  id={getTranslation('taskCenter.table.contentType')}
                  defaultMessage="Content Type"
                />
              </Typography>
            </Th>
            <Th>
              <Typography variant="sigma">
                <FormattedMessage
                  id={getTranslation('taskCenter.table.locale')}
                  defaultMessage="Locale"
                />
              </Typography>
            </Th>
            <Th>
              <Typography variant="sigma">
                <FormattedMessage
                  id={getTranslation('taskCenter.table.assignedTo')}
                  defaultMessage="Assigned To"
                />
              </Typography>
            </Th>
            <Th>
              <Typography variant="sigma">
                <FormattedMessage
                  id={getTranslation('taskCenter.table.status')}
                  defaultMessage="Status"
                />
              </Typography>
            </Th>
            <Th>
              <Typography variant="sigma">
                <FormattedMessage
                  id={getTranslation('taskCenter.table.actions')}
                  defaultMessage="Actions"
                />
              </Typography>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {assignedByMeReviews.map((review) => {
            const statusProps = getStatusBadgeProps(review.status);
            const isRejected = review.status === 'rejected';

            return (
              <Tr
                key={`${review.documentId}-${review.locale}`}
                onClick={() => handleRowClick(review)}
                style={{ cursor: 'pointer' }}
              >
                <Td>
                  <Typography fontWeight="bold">
                    {review.documentTitle || (
                      <em style={{ color: '#666' }}>
                        <FormattedMessage
                          id={getTranslation('taskCenter.table.untitled')}
                          defaultMessage="Untitled"
                        />
                      </em>
                    )}
                  </Typography>
                </Td>
                <Td>
                  <Typography>{formatContentType(review.assignedContentType)}</Typography>
                </Td>
                <Td>
                  <Badge>{review.locale}</Badge>
                </Td>
                <Td>
                  <Typography>
                    {review.assignedTo?.firstname} {review.assignedTo?.lastname}
                  </Typography>
                </Td>
                <Td>
                  <Badge background={statusProps.background} textColor={statusProps.textColor}>
                    {review.status}
                  </Badge>
                </Td>
                <Td>
                  {isRejected ? (
                    <Button
                      startIcon={<ArrowClockwise />}
                      padding={1}
                      variant="default"
                      onClick={(e: React.MouseEvent) => handleReRequestClick(e, review)}
                    >
                      <FormattedMessage
                        id={getTranslation('taskCenter.button.reRequest')}
                        defaultMessage="Re-request"
                      />
                    </Button>
                  ) : (
                    <Typography variant="omega" textColor="neutral500">
                      -
                    </Typography>
                  )}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    );
  };

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
          <Tabs.Root variant="simple" defaultValue="assigned-to-me" onValueChange={setActiveTab}>
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
                  {renderAssignedToMePendingTable()}

                  {/* Rejected Reviews Section */}
                  <Box marginTop={6}>
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
                    {renderRejectedByMeTable()}
                  </Box>
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
                  {renderAssignedByMeTable()}
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
          onClose={handleRejectModalClose}
          onSuccess={handleRejectSuccess}
        />
      )}

      {/* Re-Request Modal */}
      {reRequestModalOpen && selectedReviewForReRequest && (
        <ReRequestModal
          reviewId={selectedReviewForReRequest.documentId}
          locale={selectedReviewForReRequest.locale}
          onClose={handleReRequestModalClose}
          onSuccess={handleReRequestSuccess}
        />
      )}
    </Page.Main>
  );
};
