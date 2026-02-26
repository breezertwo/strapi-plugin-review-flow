import React from 'react';
import { Table, Thead, Tbody, Tr, Th, Td, Typography, Flex } from '@strapi/design-system';
import { FormattedMessage } from 'react-intl';
import { getTranslation } from '../../utils/getTranslation';
import {
  formatContentType,
  formatDate,
  getLatestRejectionReason,
} from '../../utils/formatters';
import { groupReviews } from '../../utils/reviewGrouping';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { LocaleBadge } from './LocaleBadge';
import type { Review, LocaleReview, ReviewGroup } from '../../types/review';

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

  const groups = groupReviews(reviews);

  return (
    <Table colCount={6} rowCount={groups.length}>
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
        {groups.map((group) => {
          const firstLocale = group.locales[0];
          // Show rejection reason from the first locale (representative)
          const rejectionReason = getLatestRejectionReason(firstLocale.comments);
          // Show most recent rejected-at across all locales
          const latestRejectedAt = group.locales
            .map((l) => l.reviewedAt)
            .filter(Boolean)
            .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];

          return (
            <Tr
              key={group.key}
              onClick={() => onRowClick(localeToReview(group, firstLocale))}
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
              <Td onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <Flex gap={1} wrap="wrap">
                  {group.locales.map((l) => (
                    <LocaleBadge
                      key={l.locale}
                      locale={l.locale}
                      status={l.status}
                      contentType={group.assignedContentType}
                      documentId={group.assignedDocumentId}
                    />
                  ))}
                </Flex>
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
                  {formatDate(latestRejectedAt)}
                </Typography>
              </Td>
              <Td>
                <Typography>
                  {group.assignedBy?.firstname} {group.assignedBy?.lastname}
                </Typography>
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};
