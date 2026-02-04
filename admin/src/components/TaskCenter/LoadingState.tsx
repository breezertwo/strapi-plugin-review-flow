import React from 'react';
import { Flex, Loader } from '@strapi/design-system';
import { FormattedMessage } from 'react-intl';
import { getTranslation } from '../../utils/getTranslation';

export const LoadingState = () => {
  return (
    <Flex justifyContent="center" padding={8}>
      <Loader>
        <FormattedMessage
          id={getTranslation('taskCenter.loading')}
          defaultMessage="Loading reviews..."
        />
      </Loader>
    </Flex>
  );
};
