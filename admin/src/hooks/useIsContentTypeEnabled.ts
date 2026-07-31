import { isContentTypeReviewEnabled, usePluginConfig } from '../api/config';

export const useIsContentTypeEnabled = (
  uid: string,
  status?: 'published' | 'draft'
): { isEnabled: boolean; isLoading: boolean } => {
  const { data, isLoading } = usePluginConfig();

  const isEnabled =
    !isLoading && isContentTypeReviewEnabled(data, uid) && (!status || status === 'draft');

  return { isEnabled, isLoading };
};
