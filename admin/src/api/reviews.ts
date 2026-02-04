import { PLUGIN_ID } from '../pluginId';

export const REVIEWS_ENDPOINTS = {
  pending: `/${PLUGIN_ID}/pending`,
  rejected: `/${PLUGIN_ID}/rejected`,
  assignedByMe: `/${PLUGIN_ID}/assigned-by-me`,
  approve: (reviewId: string, locale: string) => `/${PLUGIN_ID}/approve/${reviewId}/${locale}`,
  reject: (reviewId: string, locale: string) => `/${PLUGIN_ID}/reject/${reviewId}/${locale}`,
  reRequest: (reviewId: string, locale: string) =>
    `/${PLUGIN_ID}/re-request/${reviewId}/${locale}`,
} as const;
