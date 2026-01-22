import { IntlShape } from 'react-intl';
import { getTranslation } from './getTranslation';

export const getStatusTextColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'success100';
    case 'rejected':
      return 'danger100';
    case 'pending':
      return 'neutral0';
    default:
      return 'neutral100';
  }
};

export const getStatusBackground = (status: string) => {
  switch (status) {
    case 'approved':
      return 'success600';
    case 'rejected':
      return 'danger600';
    case 'pending':
      return 'warning600';
    default:
      return 'neutral600';
  }
};

export const getStatusString = (intl: IntlShape, status: string) => {
  switch (status) {
    case 'approved':
      return intl.formatMessage({
        id: getTranslation('review.approvee'),
        defaultMessage: 'Approved by: ',
      });
    case 'rejected':
      return intl.formatMessage({
        id: getTranslation('review.rejectee'),
        defaultMessage: 'Rejected by: ',
      });
    case 'pending':
      return intl.formatMessage({
        id: getTranslation('review.assignee'),
        defaultMessage: 'Assigned to: ',
      });
    default:
      return '';
  }
};

export const getStatusBadgeText = (intl: IntlShape, status: string) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return intl.formatMessage({
        id: getTranslation('review.status.approved'),
        defaultMessage: 'Approved',
      });
    case 'rejected':
      return intl.formatMessage({
        id: getTranslation('review.status.rejected'),
        defaultMessage: 'Rejected',
      });
    case 'pending':
      return intl.formatMessage({
        id: getTranslation('review.status.pending'),
        defaultMessage: 'Pending',
      });
    default:
      return '';
  }
};
