import type { Core } from '@strapi/strapi';

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
