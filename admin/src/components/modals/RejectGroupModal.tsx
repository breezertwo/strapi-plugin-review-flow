import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Typography,
  Flex,
  Box,
  Divider,
  Field,
  Textarea,
} from '@strapi/design-system';
import { Cross } from '@strapi/icons';
import { FormattedMessage, useIntl } from 'react-intl';
import { getTranslation } from '../../utils/getTranslation';
import { formatContentType, formatDate, getLatestComment } from '../../utils/formatters';
import type { ReviewGroup, LocaleReview, Comment } from '../../types/review';

// ─── FieldCommentList ─────────────────────────────────────────────────────────

const FieldCommentList = ({ comments }: { comments: Comment[] }) => (
  <Flex direction="column" gap={2} alignItems="flex-start">
    {comments.map((comment) => (
      <Box
        key={comment.documentId}
        padding={2}
        background="neutral100"
        hasRadius
        style={{ borderLeft: '3px solid #dcdce4' }}
      >
        {comment.fieldName && (
          <Typography
            variant="pi"
            fontWeight="bold"
            textColor="neutral700"
            style={{ display: 'block', marginBottom: '2px', fontFamily: 'monospace' }}
          >
            {comment.fieldName}
          </Typography>
        )}
        <Typography variant="pi" textColor="neutral600">
          {comment.content}
        </Typography>
      </Box>
    ))}
  </Flex>
);

interface RejectGroupModalProps {
  group: ReviewGroup;
  onClose: () => void;
  onRejectLocale: (reviewDocumentId: string, locale: string, reason: string) => Promise<boolean>;
}

interface LocaleCardProps {
  localeEntry: LocaleReview;
  reason: string;
  error: string | null;
  isRejected: boolean;
  isLoading: boolean;
  hideButton?: boolean;
  fieldComments: Comment[];
  onReasonChange: (value: string) => void;
  onReject: () => void;
}

const LocaleCard = ({
  localeEntry,
  reason,
  error,
  isRejected,
  isLoading,
  hideButton,
  fieldComments,
  onReasonChange,
  onReject,
}: LocaleCardProps) => {
  const intl = useIntl();

  const borderColor = isRejected ? '#f5c0bc' : '#dcdce4';
  const background = isRejected ? ('danger100' as const) : ('neutral0' as const);

  return (
    <Box
      padding={4}
      background={background}
      hasRadius
      style={{ border: `1px solid ${borderColor}` }}
    >
      <Flex gap={2} alignItems="baseline" wrap="wrap" marginBottom={3}>
        <Typography
          variant="omega"
          fontWeight="bold"
          textColor={isRejected ? 'danger700' : 'neutral800'}
        >
          {localeEntry.locale.toUpperCase()}
        </Typography>
        {isRejected && (
          <>
            <Typography variant="pi" textColor="neutral400">
              ·
            </Typography>
            <Typography variant="pi" textColor="danger700" fontWeight="semiBold">
              <FormattedMessage
                id={getTranslation('rejectModal.status.rejected')}
                defaultMessage="Rejected"
              />
            </Typography>
          </>
        )}
      </Flex>

      <Divider />

      <Box paddingTop={3}>
        {isRejected ? (
          <Typography variant="omega" textColor="neutral700" style={{ whiteSpace: 'pre-wrap' }}>
            {reason}
          </Typography>
        ) : (
          <Field.Root error={error || undefined}>
            <Field.Label required>
              <FormattedMessage
                id={getTranslation('rejectModal.label.reason')}
                defaultMessage="Rejection Reason"
              />
            </Field.Label>
            <Textarea
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                onReasonChange(e.target.value)
              }
              placeholder={intl.formatMessage({
                id: getTranslation('rejectModal.placeholder.reason'),
                defaultMessage: 'Please explain why you are rejecting this review...',
              })}
              style={{ minHeight: '96px' }}
            />
            {error && <Field.Error>{error}</Field.Error>}
          </Field.Root>
        )}
      </Box>

      {/* Field comments left by the reviewer — informational context */}
      {fieldComments.length > 0 && (
        <Box paddingTop={3}>
          <Divider />
          <Flex direction="column" gap={2} paddingTop={3} alignItems="flex-start">
            <Typography
              variant="pi"
              textColor="neutral600"
              fontWeight="semiBold"
              style={{ display: 'block', marginBottom: '8px' }}
            >
              <FormattedMessage
                id={getTranslation('rejectModal.fieldComments.label')}
                defaultMessage="Your field comments"
              />
            </Typography>
            <FieldCommentList comments={fieldComments} />
          </Flex>
        </Box>
      )}

      {!hideButton && (
        <Flex justifyContent="flex-end" paddingTop={3}>
          <Button
            startIcon={isRejected ? undefined : <Cross />}
            variant={isRejected ? 'ghost' : 'danger'}
            size="S"
            onClick={onReject}
            loading={isLoading}
            disabled={isRejected || !reason.trim()}
          >
            {isRejected ? (
              <FormattedMessage
                id={getTranslation('rejectModal.status.rejected')}
                defaultMessage="Rejected"
              />
            ) : (
              <FormattedMessage
                id={getTranslation('rejectModal.button.rejectLocale')}
                defaultMessage="Reject {locale}"
                values={{ locale: localeEntry.locale.toUpperCase() }}
              />
            )}
          </Button>
        </Flex>
      )}
    </Box>
  );
};

export const RejectGroupModal = ({ group, onClose, onRejectLocale }: RejectGroupModalProps) => {
  const intl = useIntl();
  const pendingLocales = group.locales.filter((l) => l.status === 'pending');
  const isSingleLocale = pendingLocales.length === 1;

  const [reasons, setReasons] = useState<Record<string, string>>(() =>
    Object.fromEntries(pendingLocales.map((l) => [l.locale, '']))
  );
  const [errors, setErrors] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(pendingLocales.map((l) => [l.locale, null]))
  );
  const [rejectedLocales, setRejectedLocales] = useState<Set<string>>(new Set());
  const [loadingLocales, setLoadingLocales] = useState<Set<string>>(new Set());
  const [isRejectingAll, setIsRejectingAll] = useState(false);

  useEffect(() => {
    if (pendingLocales.length > 0 && pendingLocales.every((l) => rejectedLocales.has(l.locale))) {
      onClose();
    }
  }, [rejectedLocales, pendingLocales, onClose]);

  const setReason = (locale: string, value: string) => {
    setReasons((prev) => ({ ...prev, [locale]: value }));
    if (value.trim()) {
      setErrors((prev) => ({ ...prev, [locale]: null }));
    }
  };

  const rejectLocale = async (localeEntry: LocaleReview): Promise<boolean> => {
    const reason = reasons[localeEntry.locale]?.trim();
    if (!reason) {
      setErrors((prev) => ({
        ...prev,
        [localeEntry.locale]: intl.formatMessage({
          id: getTranslation('rejectModal.validation.required'),
          defaultMessage: 'Rejection reason is required',
        }),
      }));
      return false;
    }

    setLoadingLocales((prev) => new Set(prev).add(localeEntry.locale));
    const success = await onRejectLocale(localeEntry.reviewDocumentId, localeEntry.locale, reason);
    setLoadingLocales((prev) => {
      const next = new Set(prev);
      next.delete(localeEntry.locale);
      return next;
    });
    if (success) {
      setRejectedLocales((prev) => new Set(prev).add(localeEntry.locale));
    }
    return success;
  };

  const rejectAll = async () => {
    const remaining = pendingLocales.filter((l) => !rejectedLocales.has(l.locale));
    const newErrors: Record<string, string | null> = { ...errors };
    let hasError = false;
    for (const l of remaining) {
      if (!reasons[l.locale]?.trim()) {
        newErrors[l.locale] = intl.formatMessage({
          id: getTranslation('rejectModal.validation.required'),
          defaultMessage: 'Rejection reason is required',
        });
        hasError = true;
      }
    }
    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsRejectingAll(true);
    await Promise.all(remaining.map(rejectLocale));
    setIsRejectingAll(false);
  };

  const remaining = pendingLocales.filter((l) => !rejectedLocales.has(l.locale));
  const allReasonsProvided = remaining.every((l) => reasons[l.locale]?.trim());

  return (
    <Modal.Root open onOpenChange={onClose}>
      <Modal.Content>
        <Modal.Header>
          <Typography fontWeight="bold" as="h2">
            <FormattedMessage
              id={getTranslation('rejectModal.title')}
              defaultMessage="Reject Review"
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
                reason={reasons[pendingLocales[0].locale] ?? ''}
                error={errors[pendingLocales[0].locale] ?? null}
                isRejected={rejectedLocales.has(pendingLocales[0].locale)}
                isLoading={loadingLocales.has(pendingLocales[0].locale)}
                fieldComments={(pendingLocales[0].comments || []).filter(
                  (c) => c.commentType === 'field-comment' && !c.resolved
                )}
                hideButton
                onReasonChange={(v) => setReason(pendingLocales[0].locale, v)}
                onReject={() => rejectLocale(pendingLocales[0])}
              />
            ) : (
              <Flex direction="column" gap={3} alignItems="stretch">
                {pendingLocales.map((localeEntry) => (
                  <LocaleCard
                    key={localeEntry.locale}
                    localeEntry={localeEntry}
                    reason={reasons[localeEntry.locale] ?? ''}
                    error={errors[localeEntry.locale] ?? null}
                    isRejected={rejectedLocales.has(localeEntry.locale)}
                    isLoading={loadingLocales.has(localeEntry.locale)}
                    fieldComments={(localeEntry.comments || []).filter(
                      (c) => c.commentType === 'field-comment' && !c.resolved
                    )}
                    onReasonChange={(v) => setReason(localeEntry.locale, v)}
                    onReject={() => rejectLocale(localeEntry)}
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
              startIcon={<Cross />}
              variant="danger"
              onClick={() => rejectLocale(pendingLocales[0])}
              loading={loadingLocales.has(pendingLocales[0].locale)}
              disabled={
                rejectedLocales.has(pendingLocales[0].locale) ||
                !reasons[pendingLocales[0].locale]?.trim()
              }
              style={{ height: '3.2rem' }}
            >
              <FormattedMessage
                id={getTranslation('rejectModal.button.reject')}
                defaultMessage="Reject Review"
              />
            </Button>
          ) : (
            <Button
              startIcon={<Cross />}
              variant="danger"
              onClick={rejectAll}
              loading={isRejectingAll}
              disabled={remaining.length === 0 || !allReasonsProvided}
              style={{ height: '3.2rem' }}
            >
              <FormattedMessage
                id={getTranslation('rejectModal.button.rejectAll')}
                defaultMessage="Reject All ({count})"
                values={{ count: remaining.length }}
              />
            </Button>
          )}
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};
