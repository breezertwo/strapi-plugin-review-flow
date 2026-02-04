import { Thead, Tr, Th, Typography } from '@strapi/design-system';
import { FormattedMessage } from 'react-intl';
import { getTranslation } from '../../utils/getTranslation';

export type ColumnKey =
  | 'title'
  | 'contentType'
  | 'locale'
  | 'assignedBy'
  | 'assignedTo'
  | 'status'
  | 'actions'
  | 'rejectionReason'
  | 'rejectedAt';

interface ColumnConfig {
  labelId: string;
  defaultMessage: string;
}

const COLUMN_CONFIGS: Record<ColumnKey, ColumnConfig> = {
  title: {
    labelId: 'taskCenter.table.title',
    defaultMessage: 'Title',
  },
  contentType: {
    labelId: 'taskCenter.table.contentType',
    defaultMessage: 'Content Type',
  },
  locale: {
    labelId: 'taskCenter.table.locale',
    defaultMessage: 'Locale',
  },
  assignedBy: {
    labelId: 'taskCenter.table.assignedBy',
    defaultMessage: 'Assigned By',
  },
  assignedTo: {
    labelId: 'taskCenter.table.assignedTo',
    defaultMessage: 'Assigned To',
  },
  status: {
    labelId: 'taskCenter.table.status',
    defaultMessage: 'Status',
  },
  actions: {
    labelId: 'taskCenter.table.actions',
    defaultMessage: 'Actions',
  },
  rejectionReason: {
    labelId: 'taskCenter.table.rejectionReason',
    defaultMessage: 'Rejection Reason',
  },
  rejectedAt: {
    labelId: 'taskCenter.table.rejectedAt',
    defaultMessage: 'Rejected At',
  },
};

interface ReviewTableHeaderProps {
  columns: ColumnKey[];
}

export const ReviewTableHeader = ({ columns }: ReviewTableHeaderProps) => {
  return (
    <Thead>
      <Tr>
        {columns.map((column) => {
          const config = COLUMN_CONFIGS[column];
          return (
            <Th key={column}>
              <Typography variant="sigma">
                <FormattedMessage
                  id={getTranslation(config.labelId)}
                  defaultMessage={config.defaultMessage}
                />
              </Typography>
            </Th>
          );
        })}
      </Tr>
    </Thead>
  );
};
