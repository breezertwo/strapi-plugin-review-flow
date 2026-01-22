import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import { PluginIcon } from './components/PluginIcon';

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

    // Inject review button into Content Manager edit view
    app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
      name: 'review-workflow-button',
      Component: ReviewButton,
    });

    // Inject review status into Content Manager edit view
    app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
      name: 'review-workflow-status',
      Component: ReviewStatus,
    });
  },
};
