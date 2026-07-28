import type { Core, UID } from '@strapi/strapi';

/**
 * Content types the review flow applies to: api:: collection/single types with draft & publish,
 * optionally narrowed down by `config.contentTypes`.
 *
 * Shared by the bootstrap (which registers the publish gate) and the controllers (which validate
 * incoming content type uids), so both always agree on the same set.
 */
export const getEnabledContentTypes = (strapi: Core.Strapi): UID.ContentType[] => {
  const configuredContentTypes: string[] =
    strapi.plugin('review-workflow').config('contentTypes') || [];

  return (Object.keys(strapi.contentTypes) as UID.ContentType[]).filter((uid) => {
    const contentType = strapi.contentType(uid);
    if (!contentType?.options?.draftAndPublish || !uid.startsWith('api::')) {
      return false;
    }
    if (configuredContentTypes.length > 0) {
      return configuredContentTypes.includes(uid);
    }
    return true;
  });
};

export const isContentTypeEnabled = (strapi: Core.Strapi, uid: unknown): boolean =>
  typeof uid === 'string' && getEnabledContentTypes(strapi).includes(uid as UID.ContentType);
