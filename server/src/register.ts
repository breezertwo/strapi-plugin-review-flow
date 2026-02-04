import type { Core } from '@strapi/strapi';

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  // Register custom permissions for the plugin
  await strapi.admin.services.permission.actionProvider.registerMany([
    {
      section: 'plugins',
      displayName: 'Assign Review',
      uid: 'review.assign',
      pluginName: 'review-workflow',
    },
    {
      section: 'plugins',
      displayName: 'Handle Review (Approve/Reject)',
      uid: 'review.handle',
      pluginName: 'review-workflow',
    },
    {
      section: 'plugins',
      displayName: 'Bulk Assign Reviews',
      uid: 'review.bulk-assign',
      pluginName: 'review-workflow',
    },
    {
      section: 'plugins',
      displayName: 'Publish Without Review',
      uid: 'review.publish-without-review',
      pluginName: 'review-workflow',
    },
  ]);

  strapi.log.info('Review workflow permissions registered');
};
