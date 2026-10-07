import { createHash } from "crypto";
import type { Core, UID } from "@strapi/strapi";

const IGNORED_ATTRIBUTES = new Set([
  "id",
  "documentId",
  "createdAt",
  "updatedAt",
  "publishedAt",
  "firstPublishedAt",
  "createdBy",
  "updatedBy",
  "locale",
  "localizations",
]);

type Attributes = Record<string, any>;

const isMorphRelation = (attribute: any) =>
  typeof attribute.relation === "string" && attribute.relation.startsWith("morph");

const buildPopulate = (strapi: Core.Strapi, attributes: Attributes): Record<string, any> => {
  const populate: Record<string, any> = {};

  for (const [name, attribute] of Object.entries(attributes)) {
    if (IGNORED_ATTRIBUTES.has(name)) {
      continue;
    }

    switch (attribute.type) {
      case "component": {
        const nested = buildPopulate(strapi, strapi.components[attribute.component].attributes);
        populate[name] = Object.keys(nested).length ? { populate: nested } : true;
        break;
      }
      case "dynamiczone":
        populate[name] = {
          on: Object.fromEntries(
            (attribute.components as string[]).map((uid) => {
              const nested = buildPopulate(strapi, strapi.components[uid].attributes);
              return [uid, Object.keys(nested).length ? { populate: nested } : true];
            }),
          ),
        };
        break;
      case "media":
        populate[name] = { fields: ["documentId"] };
        break;
      case "relation":
        populate[name] = isMorphRelation(attribute) ? true : { fields: ["documentId"] };
        break;
    }
  }

  return populate;
};

const referenceOf = (value: any) => value?.documentId ?? value?.id ?? null;

const normalize = (strapi: Core.Strapi, attributes: Attributes, entry: any): any => {
  if (!entry) {
    return null;
  }

  const result: Record<string, any> = {};

  for (const [name, attribute] of Object.entries(attributes)) {
    if (IGNORED_ATTRIBUTES.has(name)) {
      continue;
    }

    const value = entry[name];

    switch (attribute.type) {
      case "component": {
        const componentAttributes = strapi.components[attribute.component].attributes;
        result[name] = attribute.repeatable
          ? (value ?? []).map((item: any) => normalize(strapi, componentAttributes, item))
          : normalize(strapi, componentAttributes, value);
        break;
      }
      case "dynamiczone":
        result[name] = (value ?? []).map((item: any) => ({
          __component: item.__component,
          ...normalize(strapi, strapi.components[item.__component].attributes, item),
        }));
        break;
      case "media":
      case "relation":
        result[name] = Array.isArray(value) ? value.map(referenceOf) : referenceOf(value);
        break;
      default:
        result[name] = value ?? null;
    }
  }

  return result;
};

/**
 * Hash of the draft content of a document locale, ignoring metadata such as timestamps.
 * `null` if the draft does not exist.
 */
export const computeDraftContentHash = async (
  strapi: Core.Strapi,
  uid: string,
  documentId: string,
  locale: string,
): Promise<string | null> => {
  const contentType = strapi.contentType(uid as UID.ContentType);
  if (!contentType) {
    return null;
  }

  const draft = await strapi.documents(uid as UID.ContentType).findOne({
    documentId,
    locale,
    status: "draft",
    populate: buildPopulate(strapi, contentType.attributes),
  } as any);

  if (!draft) {
    return null;
  }

  const content = JSON.stringify(normalize(strapi, contentType.attributes, draft));
  return createHash("sha256").update(content).digest("hex");
};
