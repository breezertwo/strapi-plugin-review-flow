import type { Core } from "@strapi/strapi";
import { errors } from "@strapi/utils";

export default async (policyContext: any, _, { strapi }: { strapi: Core.Strapi }) => {
  const { id } = policyContext.params;

  const review = await strapi.documents("plugin::review-workflow.review-workflow").findOne({
    documentId: id,
    populate: ["assignedBy"],
  });

  // handler will report the missing review
  if (!review) {
    return true;
  }

  const uid = review.assignedContentType;
  const ability = policyContext.state.userAbility;

  if (ability?.can("plugin::content-manager.explorer.read", uid) !== true) {
    throw new errors.ForbiddenError("You are not authorized to cancel this review");
  }

  const isOrphaned = !review.assignedBy;

  if (isOrphaned && ability.can("plugin::content-manager.explorer.update", uid) !== true) {
    throw new errors.ForbiddenError("You are not authorized to cancel this review");
  }

  return true;
};
