import { LocalizedString } from "@commercetools/platform-sdk";

export const toAllLocales = (property?: LocalizedString) =>
  property
    ? Object.entries(property).map(([locale, value]) => ({ locale, value }))
    : undefined
