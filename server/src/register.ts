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
      displayName: 'Approve Review',
      uid: 'review.approve',
      pluginName: 'review-workflow',
    },
    {
      section: 'plugins',
      displayName: 'Reject Review',
      uid: 'review.reject',
      pluginName: 'review-workflow',
    },
    {
      section: 'plugins',
      displayName: 'Bulk Assign Reviews',
      uid: 'review.bulk-assign',
      pluginName: 'review-workflow',
    },
  ]);

  strapi.log.info('Review workflow permissions registered');
};
