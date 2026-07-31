import { useQuery } from "@tanstack/react-query";
import { useFetchClient } from "@strapi/strapi/admin";
import { PLUGIN_ID } from "../pluginId";
import { configKeys } from "./queryKeys";
import type { ApiResponse } from "./types";

export interface PluginConfig {
  contentTypes?: string[];
  enabledContentTypes?: string[];
  defaultLocale?: string;
}

export const isContentTypeReviewEnabled = (
  config: PluginConfig | null | undefined,
  uid: string,
): boolean => {
  if (config?.enabledContentTypes) {
    return config.enabledContentTypes.includes(uid);
  }

  const contentTypes = config?.contentTypes;
  return !contentTypes?.length || contentTypes.includes(uid);
};

export const usePluginConfig = () => {
  const { get } = useFetchClient();

  return useQuery({
    queryKey: configKeys.all,
    queryFn: async () => {
      const { data } = await get<ApiResponse<PluginConfig | null>>(`/${PLUGIN_ID}/config`);
      return data.data ?? null;
    },
    staleTime: Infinity,
  });
};
