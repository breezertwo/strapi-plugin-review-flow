import type { Core, UID } from "@strapi/strapi";

/**
 * Draft of a document locale as visible to the given ability, honoring Content Manager
 * permission conditions and field-level restrictions. `null` if it is not readable.
 */
export const findReadableDocument = async (
  strapi: Core.Strapi,
  userAbility: any,
  uid: string,
  documentId: string,
  locale: string,
) => {
  if (!userAbility || !documentId) {
    return null;
  }

  const permissionChecker = strapi
    .plugin("content-manager")
    .service("permission-checker")
    .create({ userAbility, model: uid });

  if (permissionChecker.cannot.read()) {
    return null;
  }

  const query = await permissionChecker.sanitizedQuery.read({});
  const document = await strapi.documents(uid as UID.ContentType).findFirst({
    ...query,
    filters: query.filters ? { $and: [query.filters, { documentId }] } : { documentId },
    locale,
    status: "draft",
  });

  return document ? permissionChecker.sanitizeOutput(document) : null;
};
