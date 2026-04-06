import type { Core } from '@strapi/strapi';

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  await strapi.admin.services.permission.actionProvider.registerMany([
    {
      section: 'plugins',
      displayName: 'Can Assign Review',
      uid: 'review.assign',
      pluginName: 'review-workflow',
    },
    {
      section: 'plugins',
      displayName: 'Can Bulk Assign Reviews',
      uid: 'review.bulk-assign',
      pluginName: 'review-workflow',
    },
    {
      section: 'plugins',
      displayName: 'Can Approve/Reject Reviews',
      uid: 'review.handle',
      pluginName: 'review-workflow',
    },
    {
      section: 'plugins',
      displayName: 'Publish Without Review',
      uid: 'review.publish-without-review',
      pluginName: 'review-workflow',
    },
  ]);

  strapi.log.debug('Review workflow permissions registered');
};
