import { usePendingReviewsQuery, useAssignedByMeReviewsQuery } from '../api';

export const useTaskCount = () => {
  const { data: pending } = usePendingReviewsQuery();
  const { data: assignedByMe } = useAssignedByMeReviewsQuery();

  const pendingCount = pending?.length ?? 0;
  const rejectedAssignedByMeCount =
    assignedByMe?.filter((r) => r.status === 'rejected')?.length ?? 0;

  return pendingCount + rejectedAssignedByMeCount;
};
