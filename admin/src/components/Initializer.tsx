import { useEffect, useRef } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../pluginId';
import { queryClient } from '../queryClient';
import { configKeys } from '../api/queryKeys';
import type { PluginConfig } from '../api/config';

type InitializerProps = {
  setPlugin: (id: string) => void;
};

export const Initializer = ({ setPlugin }: InitializerProps) => {
  const ref = useRef(setPlugin);
  const { get } = useFetchClient();

  useEffect(() => {
    queryClient
      .fetchQuery<PluginConfig | null>({
        queryKey: configKeys.all,
        queryFn: async () => {
          const { data } = await get(`/${PLUGIN_ID}/config`);
          return (data.data ?? null) as PluginConfig | null;
        },
        staleTime: Infinity,
      })
      .catch(() => null)
      .then(() => ref.current(PLUGIN_ID));
  }, []);

  return null;
};
