import React, { useState, useEffect } from 'react';
import { Modal, Button, Typography, Flex, Box, Divider } from '@strapi/design-system';
import { CheckCircle, WarningCircle } from '@strapi/icons';
import { FormattedMessage, useIntl } from 'react-intl';
import { getTranslation } from '../../utils/getTranslation';
import {
  formatContentType,
  formatDate,
  getLatestApprovalRequestComment,
  getLatestComment,
} from '../../utils/formatters';
import type { ReviewGroup, LocaleReview, Comment } from '../../types/review';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getUnresolvedFieldComments(localeEntry: LocaleReview): Comment[] {
  return (localeEntry.comments || []).filter(
    (c) => c.commentType === 'field-comment' && !c.resolved
  );
}

// ─── FieldCommentList ─────────────────────────────────────────────────────────

const FieldCommentList = ({ comments }: { comments: Comment[] }) => (
  <Flex
    direction="row"
    alignItems="flex-start"
    gap={2}
    style={{ width: '100%', marginLeft: '40px' }}
  >
    {comments.map((comment) => (
      <Box key={comment.documentId} padding={1} background="warning200" hasRadius>
        {comment.fieldName && (
          <Typography
            variant="pi"
            fontWeight="bold"
            textColor="warning700"
            style={{ fontFamily: 'monospace' }}
          >
            {comment.fieldName}
          </Typography>
        )}
      </Box>
    ))}
  </Flex>
);

// ─── LocaleCard ──────────────────────────────────────────────────────────────

interface LocaleCardProps {
  localeEntry: LocaleReview;
  isApproved: boolean;
  isLoading: boolean;
  hideButton?: boolean;
  unresolvedFieldComments: Comment[];
  onApprove: () => void;
}

const LocaleCard = ({
  localeEntry,
  isApproved,
  isLoading,
  hideButton,
  unresolvedFieldComments,
  onApprove,
}: LocaleCardProps) => {
  const intl = useIntl();
  const latestComment = getLatestComment(localeEntry.comments);
  const latestApprovalRequestComment = getLatestApprovalRequestComment(localeEntry.comments);

  const isBlocked = unresolvedFieldComments.length > 0;

  const borderColor = isApproved ? '#c6f0c2' : isBlocked ? '#f29d41' : '#dcdce4';
  const background = isApproved
    ? ('success100' as const)
    : isBlocked
      ? ('warning100' as const)
      : ('neutral0' as const);

  return (
    <Box
      padding={4}
      background={background}
      hasRadius
      style={{ border: `1px solid ${borderColor}` }}
    >
      {/* Card header: locale code + author/date meta */}
      <Flex justifyContent="space-between" alignItems="flex-start" gap={3} marginBottom={3}>
        <Flex gap={2} alignItems="baseline" wrap="wrap">
          <Typography
            variant="omega"
            fontWeight="bold"
            textColor={isApproved ? 'success700' : isBlocked ? 'warning700' : 'neutral800'}
          >
            {localeEntry.locale.toUpperCase()}
          </Typography>
          {isApproved && (
            <>
              <Typography variant="pi" textColor="neutral400">
                ·
              </Typography>
              <Typography variant="pi" textColor="success700" fontWeight="semiBold">
                <FormattedMessage
                  id={getTranslation('approveModal.status.approved')}
                  defaultMessage="Approved"
                />
              </Typography>
            </>
          )}
        </Flex>
      </Flex>

      <Divider />

      {/* Comment content */}
      <Box paddingTop={3}>
        {latestApprovalRequestComment ? (
          <Typography variant="omega" textColor="neutral700" style={{ whiteSpace: 'pre-wrap' }}>
            {latestApprovalRequestComment.content}
          </Typography>
        ) : (
          <Typography variant="pi" textColor="neutral400" style={{ fontStyle: 'italic' }}>
            <FormattedMessage
              id={getTranslation('approveModal.noComment')}
              defaultMessage="No comments from requester"
            />
          </Typography>
        )}
      </Box>

      {/* Unresolved field comments — blocking warning with full list */}
      {isBlocked && (
        <Flex direction="column" gap={2} paddingTop={3}>
          <Flex gap={2} alignItems="center">
            <WarningCircle width="14px" height="14px" fill="warning600" />
            <Typography variant="pi" textColor="warning700" fontWeight="semiBold">
              <FormattedMessage
                id={getTranslation('approveModal.blocked.fieldComments')}
                defaultMessage="{count, plural, one {# unresolved field comment} other {# unresolved field comments}} - either remove your comments or reject this review to the let the editor work on your comments"
                values={{ count: unresolvedFieldComments.length }}
              />
            </Typography>
          </Flex>
          <FieldCommentList comments={unresolvedFieldComments} />
        </Flex>
      )}

      {/* Per-locale approve button — only shown in the multi-locale variant */}
      {!hideButton && (
        <Flex justifyContent="flex-end" paddingTop={3}>
          <Button
            startIcon={isApproved ? undefined : <CheckCircle />}
            variant={isApproved ? 'ghost' : 'success'}
            size="S"
            onClick={onApprove}
            loading={isLoading}
            disabled={isApproved || isBlocked}
          >
            {isApproved ? (
              <FormattedMessage
                id={getTranslation('approveModal.button.approved')}
                defaultMessage="Approved"
              />
            ) : (
              <FormattedMessage
                id={getTranslation('approveModal.button.approveLocale')}
                defaultMessage="Approve {locale}"
                values={{ locale: localeEntry.locale.toUpperCase() }}
              />
            )}
          </Button>
        </Flex>
      )}
    </Box>
  );
};

// ─── ApproveModal ─────────────────────────────────────────────────────────────

interface ApproveModalProps {
  group: ReviewGroup;
  onClose: () => void;
  onApproveLocale: (reviewDocumentId: string, locale: string) => Promise<boolean>;
}

export const ApproveModal = ({ group, onClose, onApproveLocale }: ApproveModalProps) => {
  const pendingLocales = group.locales.filter((l) => l.status === 'pending');
  const isSingleLocale = pendingLocales.length === 1;

  const [approvedLocales, setApprovedLocales] = useState<Set<string>>(new Set());
  const [loadingLocales, setLoadingLocales] = useState<Set<string>>(new Set());
  const [isApprovingAll, setIsApprovingAll] = useState(false);

  useEffect(() => {
    // Auto-close when all approvable locales have been approved
    const approvable = pendingLocales.filter((l) => getUnresolvedFieldComments(l).length === 0);
    if (approvable.length > 0 && approvable.every((l) => approvedLocales.has(l.locale))) {
      onClose();
    }
  }, [approvedLocales, pendingLocales, onClose]);

  const approveLocale = async (localeEntry: LocaleReview) => {
    setLoadingLocales((prev) => new Set(prev).add(localeEntry.locale));
    const success = await onApproveLocale(localeEntry.reviewDocumentId, localeEntry.locale);
    setLoadingLocales((prev) => {
      const next = new Set(prev);
      next.delete(localeEntry.locale);
      return next;
    });
    if (success) {
      setApprovedLocales((prev) => new Set(prev).add(localeEntry.locale));
    }
  };

  const approveAll = async () => {
    setIsApprovingAll(true);
    await Promise.all(
      pendingLocales
        .filter((l) => !approvedLocales.has(l.locale) && getUnresolvedFieldComments(l).length === 0)
        .map(approveLocale)
    );
    setIsApprovingAll(false);
  };

  // Count of locales that can still be approved (not yet approved, no blocking comments)
  const approvableCount = pendingLocales.filter(
    (l) => !approvedLocales.has(l.locale) && getUnresolvedFieldComments(l).length === 0
  ).length;

  const blockedCount = pendingLocales.filter(
    (l) => getUnresolvedFieldComments(l).length > 0
  ).length;

  const singleLocaleBlocked =
    isSingleLocale && getUnresolvedFieldComments(pendingLocales[0]).length > 0;

  return (
    <Modal.Root open onOpenChange={onClose}>
      <Modal.Content>
        <Modal.Header>
          <Typography fontWeight="bold" as="h2">
            <FormattedMessage
              id={getTranslation('approveModal.title')}
              defaultMessage="Approve Review"
            />
          </Typography>
        </Modal.Header>

        <Modal.Body>
          <Flex direction="column" gap={4} alignItems="stretch">
            <Flex gap={2} alignItems="center" wrap="wrap">
              <Typography fontWeight="semiBold" textColor="neutral800">
                {group.documentTitle || (
                  <em>
                    <FormattedMessage
                      id={getTranslation('taskCenter.table.untitled')}
                      defaultMessage="Untitled"
                    />
                  </em>
                )}
              </Typography>
              <Typography variant="omega" textColor="neutral400">
                —
              </Typography>
              <Typography variant="omega" textColor="neutral600">
                {formatContentType(group.assignedContentType)}
              </Typography>
            </Flex>

            {isSingleLocale ? (
              <LocaleCard
                localeEntry={pendingLocales[0]}
                isApproved={approvedLocales.has(pendingLocales[0].locale)}
                isLoading={loadingLocales.has(pendingLocales[0].locale)}
                unresolvedFieldComments={getUnresolvedFieldComments(pendingLocales[0])}
                hideButton
                onApprove={() => approveLocale(pendingLocales[0])}
              />
            ) : (
              <Flex direction="column" gap={3} alignItems="stretch">
                {pendingLocales.map((localeEntry) => (
                  <LocaleCard
                    key={localeEntry.locale}
                    localeEntry={localeEntry}
                    isApproved={approvedLocales.has(localeEntry.locale)}
                    isLoading={loadingLocales.has(localeEntry.locale)}
                    unresolvedFieldComments={getUnresolvedFieldComments(localeEntry)}
                    onApprove={() => approveLocale(localeEntry)}
                  />
                ))}
                {blockedCount > 0 && (
                  <Flex gap={2} alignItems="center">
                    <WarningCircle width="14px" height="14px" fill="warning600" />
                    <Typography variant="pi" textColor="warning700">
                      <FormattedMessage
                        id={getTranslation('approveModal.blocked.approveAllNote')}
                        defaultMessage="{count, plural, one {# locale} other {# locales}} with unresolved field comments will be skipped"
                        values={{ count: blockedCount }}
                      />
                    </Typography>
                  </Flex>
                )}
              </Flex>
            )}
          </Flex>
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={onClose} variant="tertiary" style={{ height: '3.2rem' }}>
            <FormattedMessage id={getTranslation('common.button.cancel')} defaultMessage="Cancel" />
          </Button>

          {isSingleLocale ? (
            <Button
              startIcon={<CheckCircle />}
              variant="success"
              onClick={() => approveLocale(pendingLocales[0])}
              loading={loadingLocales.has(pendingLocales[0].locale)}
              disabled={approvedLocales.has(pendingLocales[0].locale) || singleLocaleBlocked}
              style={{ height: '3.2rem' }}
            >
              <FormattedMessage
                id={getTranslation('review.button.approve')}
                defaultMessage="Approve"
              />
            </Button>
          ) : (
            <Button
              startIcon={<CheckCircle />}
              variant="success"
              onClick={approveAll}
              loading={isApprovingAll}
              disabled={approvableCount === 0}
              style={{ height: '3.2rem' }}
            >
              <FormattedMessage
                id={getTranslation('review.button.approveAll')}
                defaultMessage="Approve ({count})"
                values={{ count: approvableCount }}
              />
            </Button>
          )}
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};
