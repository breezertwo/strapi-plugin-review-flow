import React from 'react';
import { Table, Thead, Tbody, Tr, Th, Td, Typography, Badge, Button } from '@strapi/design-system';
import { ArrowClockwise } from '@strapi/icons';
import { FormattedMessage } from 'react-intl';
import { getTranslation } from '../../utils/getTranslation';
import { formatContentType } from '../../utils/formatters';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import type { Review } from '../../types/review';

interface AssignedByMeTableProps {
  reviews: Review[];
  isLoading: boolean;
  onRowClick: (review: Review) => void;
}

export const AssignedByMeTable = ({
  reviews,
  isLoading,
  onRowClick,
}: AssignedByMeTableProps) => {
  if (isLoading) {
    return <LoadingState />;
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        messageId={getTranslation('taskCenter.assignedByMe.pendingEmpty')}
        defaultMessage="No pending reviews assigned by you"
      />
    );
  }

  return (
    <Table colCount={5} rowCount={reviews.length}>
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
                {review.assignedTo?.firstname} {review.assignedTo?.lastname}
              </Typography>
            </Td>
            <Td>
              <Badge background="warning100" textColor="warning700">
                {review.status}
              </Badge>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

interface RejectedAssignedByMeTableProps {
  reviews: Review[];
  isLoading: boolean;
  onRowClick: (review: Review) => void;
  onReRequest: (e: React.MouseEvent, review: Review) => void;
}

export const RejectedAssignedByMeTable = ({
  reviews,
  isLoading,
  onRowClick,
  onReRequest,
}: RejectedAssignedByMeTableProps) => {
  if (isLoading) {
    return <LoadingState />;
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        messageId={getTranslation('taskCenter.assignedByMe.rejectedEmpty')}
        defaultMessage="No rejected reviews requiring your action"
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
                id={getTranslation('taskCenter.table.assignedTo')}
                defaultMessage="Reviewer"
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
                id={getTranslation('taskCenter.table.actions')}
                defaultMessage="Actions"
              />
            </Typography>
          </Th>
        </Tr>
      </Thead>
      <Tbody>
        {reviews.map((review) => {
          const rejectionComment = review.comments
            ?.filter((c) => c.commentType === 'rejection')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

          return (
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
                  {review.assignedTo?.firstname} {review.assignedTo?.lastname}
                </Typography>
              </Td>
              <Td>
                <Typography variant="omega" textColor="neutral600" ellipsis>
                  {rejectionComment?.content || '-'}
                </Typography>
              </Td>
              <Td>
                <Button
                  startIcon={<ArrowClockwise />}
                  padding={1}
                  variant="default"
                  onClick={(e: React.MouseEvent) => onReRequest(e, review)}
                >
                  <FormattedMessage
                    id={getTranslation('taskCenter.button.reRequest')}
                    defaultMessage="Re-request"
                  />
                </Button>
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};
