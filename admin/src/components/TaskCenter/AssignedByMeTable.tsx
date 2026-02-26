import React, { useState } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Typography,
  Button,
  Flex,
  SingleSelect,
  SingleSelectOption,
} from '@strapi/design-system';
import { ArrowClockwise } from '@strapi/icons';
import { FormattedMessage } from 'react-intl';
import { getTranslation } from '../../utils/getTranslation';
import { formatContentType } from '../../utils/formatters';
import { groupReviews } from '../../utils/reviewGrouping';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { LocaleBadge } from './LocaleBadge';
import type { Review, ReviewGroup, LocaleReview } from '../../types/review';

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

  const groups = groupReviews(reviews);

  return (
    <Table colCount={4} rowCount={groups.length}>
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
                id={getTranslation('taskCenter.table.assignedTo')}
                defaultMessage="Assigned To"
              />
            </Typography>
          </Th>
        </Tr>
      </Thead>
      <Tbody>
        {groups.map((group) => {
          const firstLocale = group.locales[0];
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
                <Typography>
                  {group.assignedTo?.firstname} {group.assignedTo?.lastname}
                </Typography>
              </Td>
            </Tr>
          );
        })}
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
  const [reRequestPickerGroupKey, setReRequestPickerGroupKey] = useState<string | null>(null);
  const [selectedReRequestLocale, setSelectedReRequestLocale] = useState<string>('');

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

  const groups = groupReviews(reviews);

  const handleReRequestClick = (e: React.MouseEvent, group: ReviewGroup) => {
    e.stopPropagation();
    const rejected = group.locales.filter((l) => l.status === 'rejected');
    if (rejected.length === 1) {
      onReRequest(e, localeToReview(group, rejected[0]));
    } else {
      setReRequestPickerGroupKey(group.key);
      setSelectedReRequestLocale('');
    }
  };

  const handleReRequestLocaleConfirm = (e: React.MouseEvent, group: ReviewGroup) => {
    e.stopPropagation();
    if (!selectedReRequestLocale) return;
    const localeEntry = group.locales.find((l) => l.locale === selectedReRequestLocale);
    if (localeEntry) {
      onReRequest(e, localeToReview(group, localeEntry));
    }
    setReRequestPickerGroupKey(null);
    setSelectedReRequestLocale('');
  };

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
                id={getTranslation('taskCenter.table.assignedTo')}
                defaultMessage="Reviewer"
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
          const rejected = group.locales.filter((l) => l.status === 'rejected');
          const firstLocale = rejected[0] || group.locales[0];
          const isPickingLocale = reRequestPickerGroupKey === group.key;

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
                <Typography>
                  {group.assignedTo?.firstname} {group.assignedTo?.lastname}
                </Typography>
              </Td>
              <Td onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                {isPickingLocale ? (
                  <Flex gap={2} alignItems="center">
                    <SingleSelect
                      size="S"
                      value={selectedReRequestLocale}
                      onChange={(val: string) => setSelectedReRequestLocale(val)}
                      placeholder="Pick locale"
                    >
                      {rejected.map((l) => (
                        <SingleSelectOption key={l.locale} value={l.locale}>
                          {l.locale}
                        </SingleSelectOption>
                      ))}
                    </SingleSelect>
                    <Button
                      size="S"
                      variant="default"
                      disabled={!selectedReRequestLocale}
                      onClick={(e: React.MouseEvent) => handleReRequestLocaleConfirm(e, group)}
                    >
                      <FormattedMessage
                        id={getTranslation('taskCenter.button.reRequest')}
                        defaultMessage="Re-request"
                      />
                    </Button>
                    <Button
                      size="S"
                      variant="tertiary"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setReRequestPickerGroupKey(null);
                      }}
                    >
                      <FormattedMessage
                        id={getTranslation('common.button.cancel')}
                        defaultMessage="Cancel"
                      />
                    </Button>
                  </Flex>
                ) : (
                  <Button
                    startIcon={<ArrowClockwise />}
                    padding={1}
                    variant="default"
                    onClick={(e: React.MouseEvent) => handleReRequestClick(e, group)}
                  >
                    {rejected.length > 1 ? (
                      <FormattedMessage
                        id={getTranslation('taskCenter.button.reRequestLocale')}
                        defaultMessage="Re-request locale..."
                      />
                    ) : (
                      <FormattedMessage
                        id={getTranslation('taskCenter.button.reRequest')}
                        defaultMessage="Re-request"
                      />
                    )}
                  </Button>
                )}
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};
