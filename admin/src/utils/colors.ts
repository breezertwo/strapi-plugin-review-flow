export const getStatusText = (status: string) => {
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
