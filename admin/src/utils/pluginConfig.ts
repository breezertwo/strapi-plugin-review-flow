let enabledContentTypes: string[] = [];

export const setEnabledContentTypes = (types: string[]) => {
  enabledContentTypes = types;
};

export const isContentTypeEnabled = (uid: string): boolean => {
  if (enabledContentTypes.length === 0) {
    return true;
  }
  return enabledContentTypes.includes(uid);
};
