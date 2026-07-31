import type { Core } from "@strapi/strapi";
import { errors } from "@strapi/utils";

export default async (policyContext: any, _, { strapi }: { strapi: Core.Strapi }) => {
  const { id } = policyContext.params;
  const user = policyContext.state.user;

  if (!user) {
    throw new errors.UnauthorizedError("You must be authenticated");
  }

  const permission = strapi.plugin("review-workflow").service("permission");
  const reason = await permission.getApprovalBlockReason(id, user.id);

  if (!reason) {
    return true;
  }

  if (reason === "REVIEW_NOT_FOUND") {
    return true;
  }

  const message = permission.getApprovalBlockMessage(reason);

  if (reason === "NOT_ASSIGNED_REVIEWER" || reason === "SELF_APPROVAL") {
    throw new errors.ForbiddenError(message);
  }

  throw new errors.ApplicationError(message);
};
