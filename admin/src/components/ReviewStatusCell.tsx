import React, { useEffect, useState } from 'react';
import { Badge } from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../pluginId';
import { getStatusBackground, getStatusText } from '../utils/colors';

interface ReviewStatusCellProps {
  documentId: string;
  model: string;
  locale?: string;
}

export const ReviewStatusCell = ({ documentId, model, locale = 'en' }: ReviewStatusCellProps) => {
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { get } = useFetchClient();

  useEffect(() => {
    const fetchStatus = async () => {
      if (!documentId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await get(`/${PLUGIN_ID}/status/${model}/${documentId}/${locale}`);
        setStatus(data.data?.status || null);
      } catch {
        setStatus(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [documentId, model, locale, get]);

  if (isLoading) {
    return <Badge>...</Badge>;
  }

  if (!status) {
    return <Badge variant="secondary">No Review</Badge>;
  }

  return (
    <Badge background={getStatusBackground(status)} textColor={getStatusText(status)}>
      {status}
    </Badge>
  );
};
