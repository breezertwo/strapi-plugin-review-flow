import { useEffect, useState, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Badge } from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';
import { getStatusBackground, getStatusBadgeText, getStatusTextColor } from '../../utils/utils';
import { batchStatusManager } from '../../utils/batchStatusManager';
import { getTranslation } from '../../utils/getTranslation';

interface ReviewStatusCellProps {
  documentId: string;
  model: string;
  locale?: string;
}

export const ReviewStatusCell = ({ documentId, model, locale = 'en' }: ReviewStatusCellProps) => {
  const intl = useIntl();
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchClient = useFetchClient();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      batchStatusManager.setFetchClient(fetchClient);
      initializedRef.current = true;
    }
  }, [fetchClient]);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!documentId) {
        setIsLoading(false);
        return;
      }

      try {
        const fetchedStatus = await batchStatusManager.requestStatus(documentId, model, locale);
        setStatus(fetchedStatus);
      } catch {
        setStatus(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [documentId, model, locale]);

  if (isLoading) {
    return <Badge>...</Badge>;
  }

  if (!status) {
    return (
      <Badge
        style={{
          width: '80px',
        }}
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
      style={{
        width: '80px',
      }}
      background={getStatusBackground(status)}
      textColor={getStatusTextColor(status)}
    >
      {getStatusBadgeText(intl, status)}
    </Badge>
  );
};
