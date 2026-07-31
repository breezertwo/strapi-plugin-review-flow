import type { Core } from "@strapi/strapi";
import { errors } from "@strapi/utils";

export default async (policyContext: any, _, { strapi }: { strapi: Core.Strapi }) => {
  const { id } = policyContext.params;
  const user = policyContext.state.user;

  if (!user) {
    throw new errors.UnauthorizedError("You must be authenticated");
  }

  const canApprove = await strapi
    .plugin("review-workflow")
    .service("permission")
    .canApprove(id, user.id);

  if (!canApprove) {
    throw new errors.ForbiddenError("You are not authorized to approve this review");
  }

  return true;
};
