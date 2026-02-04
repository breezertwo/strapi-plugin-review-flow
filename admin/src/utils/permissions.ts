import { PLUGIN_ID } from '../pluginId';

export const pluginPermissions = {
  reviewAssign: [
    {
      action: `plugin::${PLUGIN_ID}.review.assign`,
      subject: null,
    },
  ],
  reviewHandle: [
    {
      action: `plugin::${PLUGIN_ID}.review.handle`,
      subject: null,
    },
  ],
  reviewBulkAssign: [
    {
      action: `plugin::${PLUGIN_ID}.review.bulk-assign`,
      subject: null,
    },
  ],
  reviewPublishWithoutReview: [
    {
      action: `plugin::${PLUGIN_ID}.review.publish-without-review`,
      subject: null,
    },
  ],
};
