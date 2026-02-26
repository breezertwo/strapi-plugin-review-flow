import { useQuery } from '@tanstack/react-query';
import { useFetchClient } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../pluginId';
import { configKeys } from './queryKeys';

export interface PluginConfig {
  contentTypes?: string[];
}

export const usePluginConfig = () => {
  const { get } = useFetchClient();

  return useQuery({
    queryKey: configKeys.all,
    queryFn: async () => {
      const { data } = await get(`/${PLUGIN_ID}/config`);
      return (data.data ?? null) as PluginConfig | null;
    },
    staleTime: Infinity,
  });
};


