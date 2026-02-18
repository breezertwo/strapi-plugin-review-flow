export default {
  default: {
    contentTypes: [],
  },
  validator(config: { contentTypes?: unknown }) {
    if (config.contentTypes !== undefined) {
      if (!Array.isArray(config.contentTypes)) {
        throw new Error('review-workflow: config.contentTypes must be an array of content type UIDs');
      }
      for (const uid of config.contentTypes) {
        if (typeof uid !== 'string' || !uid.startsWith('api::')) {
          throw new Error(
            `review-workflow: invalid content type UID "${uid}". Must be a string starting with "api::"`
          );
        }
      }
    }
  },
};
