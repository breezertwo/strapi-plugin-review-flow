import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import { PluginIcon } from './components/PluginIcon';
import { QueryProvider } from './components/QueryProvider';
import { queryClient } from './queryClient';
import { configKeys } from './api/queryKeys';
import type { PluginConfig } from './api/config';
import React from 'react';

const withQueryProvider =
  (Component: React.ComponentType): React.FC =>
  () =>
    React.createElement(QueryProvider, null, React.createElement(Component, null));

export default {
  register(app: any) {
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`,
      icon: withQueryProvider(PluginIcon),
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: 'Review Workflow',
      },
      Component: async () => {
        const { App } = await import('./pages/App');
        return App;
      },
      permissions: [{ action: `plugin::${PLUGIN_ID}.review.handle`, subject: null }],
    });

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: 'review-workflow',
    });
  },

  async bootstrap(app: any) {
    const { ReviewButton } = await import('./components/InjectionZone/ReviewButton');
    const { ReviewStatus } = await import('./components/InjectionZone/ReviewStatus');
    const { ReviewStatusCell } = await import('./components/InjectionZone/ReviewStatusCell');
    const { BulkReviewAction } = await import('./components/BulkReviewAction');

    app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
      name: 'review-workflow-status',
      Component: withQueryProvider(ReviewStatus),
    });

    app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
      name: 'review-workflow-button',
      Component: withQueryProvider(ReviewButton),
    });

    app.registerHook(
      'Admin/CM/pages/ListView/inject-column-in-table',
      ({ displayedHeaders, layout }: { displayedHeaders: any[]; layout: any }) => {
        const match = window.location.pathname.match(/collection-types\/(api::[^/?]+)/);
        const currentContentType = match?.[1] || '';
        const config = queryClient.getQueryData<PluginConfig | null>(configKeys.all);
        const enabledTypes = config?.contentTypes;
        if (enabledTypes?.length && !enabledTypes.includes(currentContentType)) {
          return { displayedHeaders, layout };
        }

        const review = {
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
            return React.createElement(
              QueryProvider,
              null,
              React.createElement(ReviewStatusCell, {
                documentId: data.documentId,
                model,
                locale: data.locale,
              })
            );
          },
        };

        return {
          displayedHeaders: [...displayedHeaders, review],
          layout,
        };
      }
    );

    const contentManagerApis = app.getPlugin('content-manager').apis;
    contentManagerApis.addBulkAction([BulkReviewAction]);
  },

  async registerTrads(app: any) {
    const { locales } = app;
    const importedTranslations = await Promise.all(
      (locales as string[]).map(async (locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, PLUGIN_ID),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return importedTranslations;
  },
};

type TradOptions = Record<string, string>;
const prefixPluginTranslations = (trad: TradOptions, pluginId: string): TradOptions => {
  if (!pluginId) throw new TypeError("pluginId can't be empty");
  return Object.keys(trad).reduce((acc, current) => {
    acc[`${pluginId}.${current}`] = trad[current];
    return acc;
  }, {} as TradOptions);
};
