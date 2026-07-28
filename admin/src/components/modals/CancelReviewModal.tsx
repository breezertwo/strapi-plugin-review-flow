import { Modal, Button, Typography, Flex } from '@strapi/design-system';
import { WarningCircle } from '@strapi/icons';
import { FormattedMessage } from 'react-intl';
import { getTranslation } from '../../utils/getTranslation';
import { useCancelReviewMutation } from '../../api';

interface CancelReviewModalProps {
  reviewId: string;
  locale: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CancelReviewModal = ({
  reviewId,
  locale,
  onClose,
  onSuccess,
}: CancelReviewModalProps) => {
  const cancelMutation = useCancelReviewMutation();

  const handleSubmit = async () => {
    try {
      await cancelMutation.mutateAsync({ reviewId });
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
              id={getTranslation('cancelModal.title')}
              defaultMessage="Cancel Review Request"
            />
          </Typography>
        </Modal.Header>
        <Modal.Body>
          <Flex direction="column" gap={3} alignItems="flex-start">
            <Flex gap={2} alignItems="center">
              <WarningCircle fill="warning600" width="20px" height="20px" />
              <Typography variant="omega" fontWeight="bold">
                <FormattedMessage
                  id={getTranslation('cancelModal.warning')}
                  defaultMessage="This removes the review request for {locale} and its comment history."
                  values={{ locale: locale.toUpperCase() }}
                />
              </Typography>
            </Flex>
            <Typography variant="omega" textColor="neutral600">
              <FormattedMessage
                id={getTranslation('cancelModal.description')}
                defaultMessage="The document goes back to having no review, so it cannot be published until a new review is requested and approved. Use this when a reviewer is no longer available or the request was sent by mistake."
              />
            </Typography>
          </Flex>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onClose} variant="tertiary" style={{ height: '3.2rem' }}>
            <FormattedMessage
              id={getTranslation('cancelModal.button.keep')}
              defaultMessage="Keep Request"
            />
          </Button>
          <Button
            onClick={handleSubmit}
            loading={cancelMutation.isPending}
            variant="danger"
            style={{ height: '3.2rem' }}
          >
            <FormattedMessage
              id={getTranslation('cancelModal.button.confirm')}
              defaultMessage="Cancel Request"
            />
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};
