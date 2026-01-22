import { useState } from 'react';
import { Button } from '@strapi/design-system';
import { CheckCircle } from '@strapi/icons';
import { ReviewModal } from './ReviewModal';
import { FormattedMessage } from 'react-intl';
import { getTranslation } from '../../utils/getTranslation';

export const ReviewButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        style={{
          alignSelf: 'stretch',
          height: '3.2rem',
        }}
        startIcon={<CheckCircle />}
        onClick={handleOpenModal}
        variant="secondary"
      >
        <FormattedMessage
          id={getTranslation('editview.button.requestReview')}
          defaultMessage="Request review"
        />
      </Button>
      {isModalOpen && <ReviewModal onClose={handleCloseModal} />}
    </>
  );
};
