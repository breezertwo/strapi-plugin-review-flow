import React, { useState, useEffect } from 'react';
import { Modal, Button, Typography, Flex, Box, Divider } from '@strapi/design-system';
import { CheckCircle } from '@strapi/icons';
import { FormattedMessage, useIntl } from 'react-intl';
import { getTranslation } from '../../utils/getTranslation';
import { formatContentType, formatDate, getLatestComment } from '../../utils/formatters';
import type { ReviewGroup, LocaleReview } from '../../types/review';

interface ApproveModalProps {
  group: ReviewGroup;
  onClose: () => void;
  onApproveLocale: (reviewDocumentId: string, locale: string) => Promise<boolean>;
}

interface LocaleCardProps {
  localeEntry: LocaleReview;
  isApproved: boolean;
  isLoading: boolean;
  hideButton?: boolean;
  onApprove: () => void;
}

const LocaleCard = ({
  localeEntry,
  isApproved,
  isLoading,
  hideButton,
  onApprove,
}: LocaleCardProps) => {
  const intl = useIntl();
  const latestComment = getLatestComment(localeEntry.comments);

  const authorName = latestComment?.author
    ? `${latestComment.author.firstname || ''} ${latestComment.author.lastname || ''}`.trim() ||
      intl.formatMessage({ id: getTranslation('common.unknown'), defaultMessage: 'Unknown' })
    : null;

  const borderColor = isApproved ? '#c6f0c2' : '#dcdce4';
  const background = isApproved ? ('success100' as const) : ('neutral0' as const);

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
            textColor={isApproved ? 'success700' : 'neutral800'}
          >
            {localeEntry.locale.toUpperCase()}
          </Typography>
          {authorName && (
            <>
              <Typography variant="pi" textColor="neutral400">
                ·
              </Typography>
              <Typography variant="pi" textColor="neutral600" fontWeight="semiBold">
                {authorName}
              </Typography>
            </>
          )}
          {latestComment && (
            <>
              <Typography variant="pi" textColor="neutral400">
                ·
              </Typography>
              <Typography variant="pi" textColor="neutral400">
                {formatDate(latestComment.createdAt)}
              </Typography>
            </>
          )}
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
        {latestComment ? (
          <Typography variant="omega" textColor="neutral700" style={{ whiteSpace: 'pre-wrap' }}>
            {latestComment.content}
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

      {/* Per-locale approve button — only shown in the multi-locale variant */}
      {!hideButton && (
        <Flex justifyContent="flex-end" paddingTop={3}>
          <Button
            startIcon={isApproved ? undefined : <CheckCircle />}
            variant={isApproved ? 'ghost' : 'success'}
            size="S"
            onClick={onApprove}
            loading={isLoading}
            disabled={isApproved}
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

export const ApproveModal = ({ group, onClose, onApproveLocale }: ApproveModalProps) => {
  const pendingLocales = group.locales.filter((l) => l.status === 'pending');
  const isSingleLocale = pendingLocales.length === 1;

  const [approvedLocales, setApprovedLocales] = useState<Set<string>>(new Set());
  const [loadingLocales, setLoadingLocales] = useState<Set<string>>(new Set());
  const [isApprovingAll, setIsApprovingAll] = useState(false);

  useEffect(() => {
    if (pendingLocales.length > 0 && pendingLocales.every((l) => approvedLocales.has(l.locale))) {
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
      pendingLocales.filter((l) => !approvedLocales.has(l.locale)).map(approveLocale)
    );
    setIsApprovingAll(false);
  };

  const remainingCount = pendingLocales.filter((l) => !approvedLocales.has(l.locale)).length;

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
                    onApprove={() => approveLocale(localeEntry)}
                  />
                ))}
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
              disabled={approvedLocales.has(pendingLocales[0].locale)}
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
              disabled={remainingCount === 0}
              style={{ height: '3.2rem' }}
            >
              <FormattedMessage
                id={getTranslation('review.button.approveAll')}
                defaultMessage="Approve ({count})"
                values={{ count: remainingCount }}
              />
            </Button>
          )}
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};
