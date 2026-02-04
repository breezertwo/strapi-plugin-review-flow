import React from 'react';
import { Table, Thead, Tbody, Tr, Th, Td, Typography, Badge, Flex, Button } from '@strapi/design-system';
import { CheckCircle, Cross } from '@strapi/icons';
import { FormattedMessage } from 'react-intl';
import { getTranslation } from '../../utils/getTranslation';
import { formatContentType } from '../../utils/formatters';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import type { Review } from '../../types/review';

interface AssignedToMeTableProps {
  reviews: Review[];
  isLoading: boolean;
  onRowClick: (review: Review) => void;
  onApprove: (e: React.MouseEvent, reviewId: string, locale: string) => void;
  onReject: (e: React.MouseEvent, review: Review) => void;
}

export const AssignedToMeTable = ({
  reviews,
  isLoading,
  onRowClick,
  onApprove,
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

  return (
    <Table colCount={6} rowCount={reviews.length}>
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
        {reviews.map((review) => (
          <Tr
            key={`${review.documentId}-${review.locale}`}
            onClick={() => onRowClick(review)}
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
                  onClick={(e: React.MouseEvent) => onApprove(e, review.documentId, review.locale)}
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
                  onClick={(e: React.MouseEvent) => onReject(e, review)}
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
