import { useEffect, useRef } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../pluginId';
import { setEnabledContentTypes } from '../utils/pluginConfig';

type InitializerProps = {
  setPlugin: (id: string) => void;
};

export const Initializer = ({ setPlugin }: InitializerProps) => {
  const ref = useRef(setPlugin);
  const { get } = useFetchClient();

  useEffect(() => {
    get(`/${PLUGIN_ID}/config`)
      .then(({ data }) => {
        setEnabledContentTypes(data.data?.contentTypes || []);
      })
      .catch(() => {
        console.warn(`[${PLUGIN_ID}] Failed to fetch plugin config`);
      })
      .finally(() => {
        ref.current(PLUGIN_ID);
      });
  }, []);

  return null;
};
