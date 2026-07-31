import { FormattedMessage, useIntl } from 'react-intl';
import { Badge } from '@strapi/design-system';
import { getStatusBackground, getStatusBadgeText, getStatusTextColor } from '../../utils/utils';
import { getTranslation } from '../../utils/getTranslation';
import { useReviewStatusCellQuery, usePluginConfig } from '../../api';
import { useIsContentTypeEnabled } from '../../hooks/useIsContentTypeEnabled';

interface ReviewStatusCellProps {
  documentId: string;
  model: string;
  locale?: string;
}

export const ReviewStatusCell = ({ documentId, model, locale }: ReviewStatusCellProps) => {
  const intl = useIntl();
  const { data: config } = usePluginConfig();
  const effectiveLocale = locale || config?.defaultLocale || 'en';
  const { isEnabled, isLoading: isConfigLoading } = useIsContentTypeEnabled(model);
  const { data: status, isLoading } = useReviewStatusCellQuery(documentId, model, effectiveLocale, {
    enabled: isEnabled,
  });

  if (isConfigLoading || isLoading) {
    return <Badge>...</Badge>;
  }

  if (!isEnabled) {
    return null;
  }

  if (!status) {
    return (
      <Badge
        style={{ width: '86px' }}
        background={getStatusBackground('')}
        textColor={getStatusTextColor('')}
      >
        <FormattedMessage
          id={getTranslation('review.status.no-review')}
          defaultMessage="No Review"
        />
      </Badge>
    );
  }

  return (
    <Badge
      style={{ width: '86px' }}
      background={getStatusBackground(status)}
      textColor={getStatusTextColor(status)}
    >
      {getStatusBadgeText(intl, status)}
    </Badge>
  );
};
