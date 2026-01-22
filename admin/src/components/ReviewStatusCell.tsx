import { useEffect, useState, useRef } from 'react';
import { Badge } from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';
import { getStatusBackground, getStatusText } from '../utils/colors';
import { batchStatusManager } from '../utils/batchStatusManager';

interface ReviewStatusCellProps {
  documentId: string;
  model: string;
  locale?: string;
}

export const ReviewStatusCell = ({ documentId, model, locale = 'en' }: ReviewStatusCellProps) => {
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
        textColor={getStatusText('')}
      >
        No Review
      </Badge>
    );
  }

  return (
    <Badge
      style={{
        width: '80px',
      }}
      background={getStatusBackground(status)}
      textColor={getStatusText(status)}
    >
      {status}
    </Badge>
  );
};
