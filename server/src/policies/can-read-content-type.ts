import type { Core } from "@strapi/strapi";
import { isContentTypeEnabled } from "../utils/content-types";

type Config = {
  param?: string;
};

export default (policyContext: any, config: Config = {}, { strapi }: { strapi: Core.Strapi }) => {
  const uid = policyContext.params?.[config.param ?? "assignedContentType"];

  if (!isContentTypeEnabled(strapi, uid)) {
    return false;
  }

  return (
    policyContext.state.userAbility?.can("plugin::content-manager.explorer.read", uid) === true
  );
};
