import { useState } from 'react';
import { Button } from '@strapi/design-system';
import { CheckCircle } from '@strapi/icons';
import { ReviewModal } from './ReviewModal';

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
        Request Review
      </Button>
      {isModalOpen && <ReviewModal onClose={handleCloseModal} />}
    </>
  );
};
