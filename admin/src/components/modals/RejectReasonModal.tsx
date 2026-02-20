import React, { useState } from 'react';
import { Modal, Button, Typography, Flex, Field, Textarea } from '@strapi/design-system';
import {
  useFetchClient,
  useNotification,
  useAPIErrorHandler,
  FetchError,
} from '@strapi/strapi/admin';
import { FormattedMessage, useIntl } from 'react-intl';
import { PLUGIN_ID } from '../../pluginId';
import { reviewStatusEvents } from '../../utils/reviewStatusEvents';
import { getTranslation } from '../../utils/getTranslation';

interface RejectReasonModalProps {
  reviewId: string;
  locale: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RejectReasonModal = ({
  reviewId,
  locale,
  onClose,
  onSuccess,
}: RejectReasonModalProps) => {
  const intl = useIntl();
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { put } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { formatAPIError } = useAPIErrorHandler();

  const handleSubmit = async () => {
    if (!rejectionReason.trim()) {
      setError(
        intl.formatMessage({
          id: getTranslation('rejectModal.validation.required'),
          defaultMessage: 'Rejection reason is required',
        })
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await put(`/${PLUGIN_ID}/reject/${reviewId}/${locale}`, {
        rejectionReason: rejectionReason.trim(),
      });

      toggleNotification({
        type: 'success',
        message: intl.formatMessage({
          id: getTranslation('notification.review.rejected'),
          defaultMessage: 'Review rejected successfully',
        }),
      });

      reviewStatusEvents.emit();

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err) {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(err as FetchError),
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            <Typography variant="omega" textColor="neutral600">
              <FormattedMessage
                id={getTranslation('rejectModal.description')}
                defaultMessage="Please provide a reason for rejecting this review. This will help the requester understand what changes are needed."
              />
            </Typography>
            <Field.Root error={error || undefined}>
              <Field.Label required>
                <FormattedMessage
                  id={getTranslation('rejectModal.label.reason')}
                  defaultMessage="Rejection Reason"
                />
              </Field.Label>
              <Textarea
                value={rejectionReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setRejectionReason(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={intl.formatMessage({
                  id: getTranslation('rejectModal.placeholder.reason'),
                  defaultMessage: 'Please explain why you are rejecting this review...',
                })}
                style={{ minHeight: '120px' }}
              />
              {error && <Field.Error>{error}</Field.Error>}
            </Field.Root>
          </Flex>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onClose} variant="tertiary" style={{ height: '3.2rem' }}>
            <FormattedMessage id={getTranslation('common.button.cancel')} defaultMessage="Cancel" />
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isLoading}
            variant="danger"
            style={{ height: '3.2rem' }}
          >
            <FormattedMessage
              id={getTranslation('rejectModal.button.reject')}
              defaultMessage="Reject Review"
            />
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};
