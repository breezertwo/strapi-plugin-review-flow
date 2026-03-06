import { usePluginConfig } from '../api/config';

export const useIsContentTypeEnabled = (
  uid: string,
  status?: 'published' | 'draft'
): { isEnabled: boolean; isLoading: boolean } => {
  const { data, isLoading } = usePluginConfig();

  const contentTypes = data?.contentTypes;
  const isEnabled =
    !isLoading &&
    (!contentTypes?.length || contentTypes.includes(uid)) &&
    (!status || status === 'draft');

  return { isEnabled, isLoading };
};
