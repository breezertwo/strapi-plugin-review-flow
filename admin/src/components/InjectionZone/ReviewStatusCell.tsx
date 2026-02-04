import { useEffect, useState, useRef, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Badge } from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';
import { getStatusBackground, getStatusBadgeText, getStatusTextColor } from '../../utils/utils';
import { batchStatusManager } from '../../utils/batchStatusManager';
import { reviewStatusEvents } from '../../utils/reviewStatusEvents';
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

  const fetchStatus = useCallback(async () => {
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
  }, [documentId, model, locale]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    const unsubscribe = reviewStatusEvents.subscribe(() => {
      setIsLoading(true);
      fetchStatus();
    });
    return unsubscribe;
  }, [fetchStatus]);

  if (isLoading) {
    return <Badge>...</Badge>;
  }

  if (!status) {
    return (
      <Badge
        style={{
          width: '86px',
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
        width: '86px',
      }}
      background={getStatusBackground(status)}
      textColor={getStatusTextColor(status)}
    >
      {getStatusBadgeText(intl, status)}
    </Badge>
  );
};
