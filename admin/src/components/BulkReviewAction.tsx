import React, { useEffect, useState } from 'react';
import { CheckCircle } from '@strapi/icons';
import { useFetchClient } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { BulkReviewModal } from './BulkReviewModal';
import { PLUGIN_ID } from '../pluginId';
import { getTranslation } from '../utils/getTranslation';

interface Document {
  documentId: string;
  locale?: string;
  [key: string]: unknown;
}

interface ListViewContext {
  collectionType: string;
  documents: Document[];
  model: string;
}

interface BulkActionDescription {
  dialog?: {
    type: 'modal';
    title: string;
    content: React.ComponentType<{ onClose: () => void }>;
    onClose?: () => void;
  };
  disabled?: boolean;
  icon?: React.ReactNode;
  label: string;
  onClick?: (event: React.SyntheticEvent) => void;
  type?: 'icon' | 'default';
  variant?: 'default' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'ghost';
}

export const BulkReviewAction = ({
  documents,
  model,
}: ListViewContext): BulkActionDescription | null => {
  const intl = useIntl();
  const { get } = useFetchClient();
  const [canBulkAssign, setCanBulkAssign] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const { data } = await get(`/${PLUGIN_ID}/permissions/bulk-assign`);
        setCanBulkAssign(data.data?.canBulkAssign ?? false);
      } catch (error) {
        setCanBulkAssign(false);
      }
    };

    checkPermission();
  }, [get]);

  // Don't show the action while loading or if user doesn't have permission
  if (canBulkAssign === null || canBulkAssign === false) {
    return null;
  }

  // Only show the action for API content types
  const isApiContentType = model.startsWith('api::');

  if (!isApiContentType) {
    return null;
  }

  return {
    label: intl.formatMessage({
      id: getTranslation('bulk.action.requestReview'),
      defaultMessage: 'Request Review',
    }),
    icon: <CheckCircle />,
    disabled: documents.length === 0,
    variant: 'secondary',
    dialog: {
      type: 'modal',
      title: intl.formatMessage({
        id: getTranslation('bulk.modal.title'),
        defaultMessage: 'Bulk Request Review',
      }),
      content: ({ onClose }: { onClose: () => void }) => {
        return <BulkReviewModal documents={documents} model={model} onClose={onClose} />;
      },
    },
  };
};
