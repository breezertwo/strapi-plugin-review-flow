import { FormattedMessage, useIntl } from 'react-intl';
import { Badge } from '@strapi/design-system';
import { getStatusBackground, getStatusBadgeText, getStatusTextColor } from '../../utils/utils';
import { getTranslation } from '../../utils/getTranslation';
import { useReviewStatusCellQuery } from '../../api';

interface ReviewStatusCellProps {
  documentId: string;
  model: string;
  locale?: string;
}

export const ReviewStatusCell = ({ documentId, model, locale = 'en' }: ReviewStatusCellProps) => {
  const intl = useIntl();
  const { data: status, isLoading } = useReviewStatusCellQuery(documentId, model, locale);

  if (isLoading) {
    return <Badge>...</Badge>;
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
