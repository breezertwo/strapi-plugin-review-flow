import { Box, Typography } from '@strapi/design-system';
import { FormattedMessage } from 'react-intl';

interface EmptyStateProps {
  messageId: string;
  defaultMessage: string;
}

export const EmptyState = ({ messageId, defaultMessage }: EmptyStateProps) => {
  return (
    <Box padding={8} textAlign="center">
      <Typography variant="delta" textColor="neutral600">
        <FormattedMessage id={messageId} defaultMessage={defaultMessage} />
      </Typography>
    </Box>
  );
};
