import { CheckCircle } from '@strapi/icons';
import { useRBAC } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { BulkReviewModal } from './modals/BulkReviewModal';
import { pluginPermissions, getTranslation } from '../utils';
import { QueryProvider } from './QueryProvider';
import { queryClient } from '../queryClient';
import { configKeys } from '../api/queryKeys';
import type { PluginConfig } from '../api/config';
import React from 'react';

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
  const { allowedActions, isLoading: isPermissionsLoading } = useRBAC(pluginPermissions);

  // Read config from the query cache synchronously — no QueryProvider needed
  const config = queryClient.getQueryData<PluginConfig | null>(configKeys.all);
  const enabledTypes = config?.contentTypes;
  const isEnabled = !enabledTypes?.length || enabledTypes.includes(model);

  if (isPermissionsLoading || !allowedActions['canBulkAssign'] || !model.startsWith('api::') || !isEnabled) {
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
      content: ({ onClose }: { onClose: () => void }) => (
        <QueryProvider>
          <BulkReviewModal documents={documents} model={model} onClose={onClose} />
        </QueryProvider>
      ),
    },
  };
};
