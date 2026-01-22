import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import { PluginIcon } from './components/PluginIcon';
import React from 'react';

export default {
  register(app: any) {
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: 'Review Workflow',
      },
      Component: async () => {
        const { App } = await import('./pages/App');
        return App;
      },
    });

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: 'review-workflow',
    });
  },

  async bootstrap(app: any) {
    // Import and register the injection zone components
    const { ReviewButton } = await import('./components/InjectionZone/ReviewButton');
    const { ReviewStatus } = await import('./components/InjectionZone/ReviewStatus');
    const { ReviewStatusCell } = await import('./components/ReviewStatusCell');

    app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
      name: 'review-workflow-status',
      Component: ReviewStatus,
    });

    app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
      name: 'review-workflow-button',
      Component: ReviewButton,
    });

    app.registerHook(
      'Admin/CM/pages/ListView/inject-column-in-table',
      ({ displayedHeaders, layout }: { displayedHeaders: any[]; layout: any }) => {
        // Add the review status column
        const reviewColumn = {
          attribute: { type: 'custom' },
          name: 'reviewStatus',
          label: {
            id: `${PLUGIN_ID}.listview.column.reviewStatus`,
            defaultMessage: 'Review Status',
          },
          searchable: true,
          sortable: true,
          cellFormatter: (
            data: any,
            _header: any,
            { model }: { collectionType: string; model: string }
          ) => {
            return React.createElement(ReviewStatusCell, {
              documentId: data.documentId,
              model,
              locale: data.locale || 'en',
            });
          },
        };

        return {
          displayedHeaders: [...displayedHeaders, reviewColumn],
          layout,
        };
      }
    );
  },
};
