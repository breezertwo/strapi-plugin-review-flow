import type { Core } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import { findReadableDocument } from "../utils/document-access";

export default async (policyContext: any, _, { strapi }: { strapi: Core.Strapi }) => {
  const review = await strapi.documents("plugin::review-workflow.review-workflow").findOne({
    documentId: policyContext.params.id,
  });

  // handler will report the missing review
  if (!review) {
    return true;
  }

  const document = await findReadableDocument(
    strapi,
    policyContext.state.userAbility,
    review.assignedContentType,
    review.assignedDocumentId,
    review.locale,
  );

  if (!document) {
    throw new errors.ForbiddenError("You are not authorized to access the reviewed document");
  }

  return true;
};
