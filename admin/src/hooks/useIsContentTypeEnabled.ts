import { usePluginConfig } from '../api/config';

export const useIsContentTypeEnabled = (
  uid: string
): { isEnabled: boolean; isLoading: boolean } => {
  const { data, isLoading } = usePluginConfig();
  const contentTypes = data?.contentTypes;
  const isEnabled = !contentTypes?.length || contentTypes.includes(uid);
  return { isEnabled, isLoading };
};
