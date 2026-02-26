import { useState } from 'react';
import { Button } from '@strapi/design-system';
import { CheckCircle } from '@strapi/icons';
import { useAuth, useRBAC } from '@strapi/strapi/admin';
import { useParams, useSearchParams } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { ReviewModal } from '../modals/ReviewModal';
import { getTranslation, pluginPermissions } from '../../utils';
import { useReviewStatusQuery } from '../../api';
import { useIsContentTypeEnabled } from '../../hooks/useIsContentTypeEnabled';

export const ReviewButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const params = useParams<{ id: string; slug: string }>();
  const [searchParams] = useSearchParams();
  const locale = searchParams.get('plugins[i18n][locale]') || 'en';
  const { allowedActions, isLoading: isPermissionsLoading } = useRBAC(pluginPermissions);
  const { isEnabled, isLoading: isConfigLoading } = useIsContentTypeEnabled(params.slug || '');

  useAuth('ReviewButton', (state) => state);

  const { data: review, isLoading } = useReviewStatusQuery(params.slug, params.id, locale);

  if (
    !isEnabled ||
    isConfigLoading ||
    isPermissionsLoading ||
    isLoading ||
    !allowedActions['canAssign'] ||
    review?.status === 'pending' ||
    review?.status === 'rejected'
  ) {
    return null;
  }

  return (
    <>
      <Button
        style={{
          alignSelf: 'stretch',
          height: '3.2rem',
        }}
        startIcon={<CheckCircle />}
        onClick={() => setIsModalOpen(true)}
        variant="secondary"
      >
        <FormattedMessage
          id={getTranslation('editview.button.requestReview')}
          defaultMessage="Request review"
        />
      </Button>
      {isModalOpen && <ReviewModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
};
