import type { Core } from '@strapi/strapi';

export default (policyContext, config, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx, next) => {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be authenticated');
    }

    const canApprove = await strapi
      .plugin('review-workflow')
      .service('permission')
      .canApprove(id, user.id);

    if (!canApprove) {
      return ctx.forbidden('You are not authorized to approve this review');
    }

    await next();
  };
};
