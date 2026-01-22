export const getStatusText = (status: string) => {
  console.log('getStatusColor', status);
  switch (status) {
    case 'approved':
      return 'success100';
    case 'rejected':
      return 'danger100';
    case 'pending':
      return 'warning100';
    default:
      return 'neutral100';
  }
};

export const getStatusBackground = (status: string) => {
  console.log('getStatusBackground', status);
  switch (status) {
    case 'approved':
      return 'success600';
    case 'rejected':
      return 'danger600';
    case 'pending':
      return 'warning600';
    default:
      return 'neutra600';
  }
};
