import React, { useState } from 'react';
import { Modal, Button, Typography, Flex, Field, Textarea } from '@strapi/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import { getTranslation } from '../../utils/getTranslation';
import { useReRequestMutation } from '../../api';

interface ReRequestModalProps {
  reviewId: string;
  locale: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReRequestModal = ({ reviewId, locale, onClose, onSuccess }: ReRequestModalProps) => {
  const intl = useIntl();
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const reRequestMutation = useReRequestMutation();

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setError(
        intl.formatMessage({
          id: getTranslation('reRequestModal.validation.required'),
          defaultMessage: 'Comment is required',
        })
      );
      return;
    }

    setError(null);

    try {
      await reRequestMutation.mutateAsync({ reviewId, locale, comment: comment.trim() });
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      // error notification is handled by the mutation hook
    }
  };

  return (
    <Modal.Root open onOpenChange={onClose}>
      <Modal.Content>
        <Modal.Header>
          <Typography fontWeight="bold">
            <FormattedMessage
              id={getTranslation('reRequestModal.title')}
              defaultMessage="Re-request Review"
            />
          </Typography>
        </Modal.Header>
        <Modal.Body>
          <Flex direction="column" gap={4} alignItems="stretch">
            <Typography variant="omega" textColor="neutral600">
              <FormattedMessage
                id={getTranslation('reRequestModal.description')}
                defaultMessage="Add a comment explaining what changes you have made or why you are re-requesting the review."
              />
            </Typography>
            <Field.Root error={error || undefined}>
              <Field.Label required>
                <FormattedMessage
                  id={getTranslation('reRequestModal.label.comment')}
                  defaultMessage="Comment"
                />
              </Field.Label>
              <Textarea
                value={comment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setComment(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={intl.formatMessage({
                  id: getTranslation('reRequestModal.placeholder.comment'),
                  defaultMessage: 'Describe the changes you have made...',
                })}
                style={{ minHeight: '120px' }}
              />
              <Field.Error />
            </Field.Root>
          </Flex>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onClose} variant="tertiary" style={{ height: '3.2rem' }}>
            <FormattedMessage id={getTranslation('common.button.cancel')} defaultMessage="Cancel" />
          </Button>
          <Button
            onClick={handleSubmit}
            loading={reRequestMutation.isPending}
            variant="default"
            style={{ height: '3.2rem' }}
          >
            <FormattedMessage
              id={getTranslation('reRequestModal.button.submit')}
              defaultMessage="Re-request Review"
            />
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};
