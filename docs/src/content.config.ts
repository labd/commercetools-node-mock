import { defineCollection } from "astro:content";
import { docsLoader, i18nLoader } from "@astrojs/starlight/loaders";
import { docsSchema, i18nSchema } from "@astrojs/starlight/schema";

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	// Starlight reads this collection unconditionally, so it has to be declared
	// even though the site is English-only.
	i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
};
