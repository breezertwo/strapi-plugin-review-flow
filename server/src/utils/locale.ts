import type { Core, UID } from '@strapi/strapi';

export async function getDefaultLocale(strapi: Core.Strapi): Promise<string> {
  try {
    return await strapi.plugin('i18n').service('locales').getDefaultLocale();
  } catch {
    return 'en';
  }
}

export async function resolveLocale(
  strapi: Core.Strapi,
  locale: string | null | undefined
): Promise<string> {
  if (locale && locale !== 'null' && locale !== 'undefined') {
    return locale;
  }
  return getDefaultLocale(strapi);
}

export const isLocalized = (strapi: Core.Strapi, uid: string): boolean =>
  (strapi.contentType(uid as UID.ContentType)?.pluginOptions as any)?.i18n?.localized === true;

/**
 * Concrete locales targeted by a document service call, expanding arrays and the `*` wildcard.
 */
export async function resolveTargetLocales(
  strapi: Core.Strapi,
  uid: string,
  documentId: string,
  locale: unknown
): Promise<string[]> {
  if (!isLocalized(strapi, uid)) {
    return [await getDefaultLocale(strapi)];
  }

  if (locale === '*') {
    const entries = await strapi.db.query(uid as UID.ContentType).findMany({
      where: { documentId, publishedAt: null },
      select: ['locale'],
    });
    return [...new Set((entries as { locale: string }[]).map((entry) => entry.locale))];
  }

  if (Array.isArray(locale)) {
    const locales = locale.filter((item): item is string => typeof item === 'string' && !!item);
    if (locales.length > 0) {
      return [...new Set(locales)];
    }
    return [await getDefaultLocale(strapi)];
  }

  return [await resolveLocale(strapi, typeof locale === 'string' ? locale : undefined)];
}
