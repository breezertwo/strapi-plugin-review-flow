import React from 'react';
import { Table, Thead, Tbody, Tr, Th, Td, Typography, Badge } from '@strapi/design-system';
import { FormattedMessage } from 'react-intl';
import { getTranslation } from '../../utils/getTranslation';
import { formatContentType, formatDate, getLatestRejectionReason } from '../../utils/formatters';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import type { Review } from '../../types/review';

interface RejectedByMeTableProps {
  reviews: Review[];
  isLoading: boolean;
  onRowClick: (review: Review) => void;
}

export const RejectedByMeTable = ({
  reviews,
  isLoading,
  onRowClick,
}: RejectedByMeTableProps) => {
  if (isLoading) {
    return <LoadingState />;
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        messageId={getTranslation('taskCenter.rejected.empty')}
        defaultMessage="No rejected reviews"
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
        {reviews.map((review) => {
          const rejectionReason = getLatestRejectionReason(review.comments);

          return (
            <Tr
              key={`rejected-${review.documentId}-${review.locale}`}
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
