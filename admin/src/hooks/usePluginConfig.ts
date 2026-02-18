import { useState, useCallback, useEffect } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../pluginId';
import { isContentTypeEnabled, setEnabledContentTypes } from '../utils/pluginConfig';

export const usePluginConfig = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { get } = useFetchClient();

  const fetchConfig = useCallback(async () => {
    try {
      const { data } = await get(`/${PLUGIN_ID}/config`);
      setEnabledContentTypes(data.data?.contentTypes || []);
    } catch {
      console.error(`[${PLUGIN_ID}] Failed to fetch plugin config. Defaulting to all enabled`);
    } finally {
      setIsLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { isContentTypeEnabled, isLoading };
};
