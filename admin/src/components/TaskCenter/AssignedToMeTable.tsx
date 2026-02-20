import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Typography,
  Badge,
  Flex,
  Button,
} from '@strapi/design-system';
import { CheckCircle, Cross } from '@strapi/icons';
import { FormattedMessage } from 'react-intl';
import { getTranslation } from '../../utils/getTranslation';
import { formatContentType, getStatusBadgeProps } from '../../utils/formatters';
import { groupReviews } from '../../utils/reviewGrouping';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import type { Review, ReviewGroup, LocaleReview } from '../../types/review';

interface AssignedToMeTableProps {
  reviews: Review[];
  isLoading: boolean;
  onRowClick: (review: Review) => void;
  onApproveClick: (group: ReviewGroup) => void;
  onReject: (e: React.MouseEvent, group: ReviewGroup) => void;
}

function localeToReview(group: ReviewGroup, localeEntry: LocaleReview): Review {
  return {
    documentId: localeEntry.reviewDocumentId,
    assignedContentType: group.assignedContentType,
    assignedDocumentId: group.assignedDocumentId,
    locale: localeEntry.locale,
    status: localeEntry.status,
    documentTitle: group.documentTitle,
    assignedBy: group.assignedBy,
    assignedTo: group.assignedTo,
    comments: localeEntry.comments,
    reviewedAt: localeEntry.reviewedAt,
  };
}

export const AssignedToMeTable = ({
  reviews,
  isLoading,
  onRowClick,
  onApproveClick,
  onReject,
}: AssignedToMeTableProps) => {
  if (isLoading) {
    return <LoadingState />;
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        messageId={getTranslation('taskCenter.assignedToMe.empty')}
        defaultMessage="No pending reviews assigned to you"
      />
    );
  }

  const groups = groupReviews(reviews);

  return (
    <Table colCount={5} rowCount={groups.length}>
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
                id={getTranslation('taskCenter.table.locales')}
                defaultMessage="Locales"
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
                id={getTranslation('taskCenter.table.actions')}
                defaultMessage="Actions"
              />
            </Typography>
          </Th>
        </Tr>
      </Thead>
      <Tbody>
        {groups.map((group) => {
          const pending = group.locales.filter((l) => l.status === 'pending');
          const firstPending = pending[0];

          return (
            <Tr
              key={group.key}
              onClick={() => firstPending && onRowClick(localeToReview(group, firstPending))}
              style={{ cursor: 'pointer' }}
            >
              <Td>
                <Typography fontWeight="bold">
                  {group.documentTitle || (
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
                <Typography>{formatContentType(group.assignedContentType)}</Typography>
              </Td>
              <Td>
                <Flex gap={1} wrap="wrap">
                  {group.locales.map((l) => {
                    const badgeProps = getStatusBadgeProps(l.status);
                    return (
                      <Badge
                        key={l.locale}
                        background={badgeProps.background}
                        textColor={badgeProps.textColor}
                      >
                        {l.locale}
                      </Badge>
                    );
                  })}
                </Flex>
              </Td>
              <Td>
                <Typography>
                  {group.assignedBy?.firstname} {group.assignedBy?.lastname}
                </Typography>
              </Td>
              <Td onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <Flex gap={2}>
                  <Button
                    style={{ minWidth: 130 }}
                    padding={1}
                    startIcon={<CheckCircle />}
                    variant="success"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onApproveClick(group);
                    }}
                  >
                    {pending.length > 1 ? (
                      <FormattedMessage
                        id={getTranslation('review.button.approveAll')}
                        defaultMessage="Approve ({count})"
                        values={{ count: pending.length }}
                      />
                    ) : (
                      <FormattedMessage
                        id={getTranslation('review.button.approve')}
                        defaultMessage="Approve"
                      />
                    )}
                  </Button>
                  <Button
                    style={{ minWidth: 130 }}
                    startIcon={<Cross />}
                    padding={1}
                    variant="danger"
                    onClick={(e: React.MouseEvent) => onReject(e, group)}
                  >
                    {pending.length > 1 ? (
                      <FormattedMessage
                        id={getTranslation('review.button.rejectAll')}
                        defaultMessage="Reject ({count})"
                        values={{ count: pending.length }}
                      />
                    ) : (
                      <FormattedMessage
                        id={getTranslation('review.button.reject')}
                        defaultMessage="Reject"
                      />
                    )}
                  </Button>
                </Flex>
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};
