import { useState, useCallback, useEffect } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../pluginId';

export const useTaskCount = () => {
  const [count, setCount] = useState(0);
  const { get } = useFetchClient();

  const fetchCounts = useCallback(async () => {
    try {
      const [pendingRes, assignedByMeRes] = await Promise.all([
        get(`/${PLUGIN_ID}/pending`),
        get(`/${PLUGIN_ID}/assigned-by-me`),
      ]);

      const pendingCount = pendingRes.data?.data?.length ?? 0;
      const rejectedAssignedByMeCount =
        assignedByMeRes.data?.data?.filter((r: { status: string }) => r.status === 'rejected')
          ?.length ?? 0;
      setCount(pendingCount + rejectedAssignedByMeCount);
    } catch {
      // Silently fail - badge just won't show
    }
  }, [get]);

  useEffect(() => {
    fetchCounts();

    const handleChange = () => fetchCounts();
    window.addEventListener('review-workflow:changed', handleChange);
    return () => window.removeEventListener('review-workflow:changed', handleChange);
  }, [fetchCounts]);

  return count;
};
