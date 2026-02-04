import { Typography } from '@strapi/design-system';
import { FormattedMessage } from 'react-intl';
import { getTranslation } from '../../utils/getTranslation';

interface DocumentTitleCellProps {
  title?: string | null;
}

export const DocumentTitleCell = ({ title }: DocumentTitleCellProps) => {
  return (
    <Typography fontWeight="bold">
      {title || (
        <em style={{ color: '#666' }}>
          <FormattedMessage
            id={getTranslation('taskCenter.table.untitled')}
            defaultMessage="Untitled"
          />
        </em>
      )}
    </Typography>
  );
};
