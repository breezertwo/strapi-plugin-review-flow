export default [
  {
    method: 'POST',
    path: '/assign',
    handler: 'review-workflow.assignReview',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        {
          name: 'plugin::content-manager.hasPermissions',
          config: { actions: ['plugin::review-workflow.review.assign'] },
        },
      ],
    },
  },
  {
    method: 'PUT',
    path: '/approve/:id/:locale',
    handler: 'review-workflow.approveReview',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        {
          name: 'plugin::content-manager.hasPermissions',
          config: { actions: ['plugin::review-workflow.review.handle'] },
        },
      ],
    },
  },
  {
    method: 'PUT',
    path: '/reject/:id/:locale',
    handler: 'review-workflow.rejectReview',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        {
          name: 'plugin::content-manager.hasPermissions',
          config: { actions: ['plugin::review-workflow.review.handle'] },
        },
      ],
    },
  },
  {
    method: 'PUT',
    path: '/re-request/:id/:locale',
    handler: 'review-workflow.reRequestReview',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        {
          name: 'plugin::content-manager.hasPermissions',
          config: { actions: ['plugin::review-workflow.review.assign'] },
        },
      ],
    },
  },
  {
    method: 'GET',
    path: '/status/:assignedContentType/:assignedDocumentId/:locale',
    handler: 'review-workflow.getReviewStatus',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'POST',
    path: '/status/batch/:assignedContentType/:locale',
    handler: 'review-workflow.getBatchReviewStatuses',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'GET',
    path: '/pending',
    handler: 'review-workflow.listPendingReviews',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'GET',
    path: '/rejected',
    handler: 'review-workflow.listRejectedReviews',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'GET',
    path: '/assigned-by-me',
    handler: 'review-workflow.listAssignedByUserReviews',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'POST',
    path: '/bulk-assign',
    handler: 'review-workflow.bulkAssignReviews',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        {
          name: 'plugin::content-manager.hasPermissions',
          config: { actions: ['plugin::review-workflow.review.bulk-assign'] },
        },
      ],
    },
  },
  {
    method: 'GET',
    path: '/permissions/bulk-assign',
    handler: 'review-workflow.canBulkAssign',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'GET',
    path: '/config',
    handler: 'review-workflow.getConfig',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'GET',
    path: '/reviewers',
    handler: 'review-workflow.getReviewers',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
];
