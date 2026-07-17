// @ts-check
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightLlmsTxt from "starlight-llms-txt";

const REPO = "https://github.com/labd/commercetools-node-mock";

// https://astro.build/config
export default defineConfig({
	// Project GitHub Pages site: https://labd.github.io/commercetools-node-mock/
	site: "https://labd.github.io",
	base: "/commercetools-node-mock",
	integrations: [
		starlight({
			title: "@labdigital/commercetools-mock",
			description:
				"A comprehensive mock of the commercetools REST API for testing " +
				"TypeScript codebases. Seed data, run assertions, and verify your " +
				"commercetools integrations without hitting a real project.",
			logo: {
				src: "./src/assets/logo.svg",
				replacesTitle: false,
			},
			favicon: "/favicon.svg",
			social: [
				{
					icon: "github",
					label: "GitHub",
					href: REPO,
				},
			],
			editLink: {
				baseUrl: `${REPO}/edit/main/docs/`,
			},
			lastUpdated: true,
			plugins: [
				starlightLlmsTxt({
					projectName: "@labdigital/commercetools-mock",
					description:
						"A comprehensive mock of the commercetools REST API for testing " +
						"TypeScript codebases with msw, vitest and the commercetools SDK.",
				}),
			],
			sidebar: [
				{
					label: "Getting started",
					items: [
						{ label: "Introduction", slug: "getting-started/introduction" },
						{ label: "Installation", slug: "getting-started/installation" },
						{ label: "Quick start", slug: "getting-started/quick-start" },
						{ label: "How it works", slug: "getting-started/how-it-works" },
					],
				},
				{
					label: "Configuration",
					items: [
						{ label: "Options", slug: "configuration/options" },
						{ label: "Authentication", slug: "configuration/authentication" },
					],
				},
				{
					label: "Usage",
					items: [
						{ label: "Seeding data", slug: "usage/seeding-data" },
						{ label: "Querying data", slug: "usage/querying-data" },
						{ label: "msw integration", slug: "usage/msw" },
					],
				},
				{
					label: "Storage backends",
					items: [
						{ label: "Overview", slug: "storage/overview" },
						{ label: "In-memory", slug: "storage/in-memory" },
						{ label: "SQLite", slug: "storage/sqlite" },
						{ label: "Custom backends", slug: "storage/custom" },
					],
				},
				{
					label: "Running as a server",
					items: [
						{ label: "Standalone server", slug: "server/standalone" },
						{ label: "Docker image", slug: "server/docker" },
					],
				},
				{
					label: "Recipes",
					items: [
						{ label: "Vitest setup", slug: "recipes/vitest-setup" },
						{ label: "Testing a cart flow", slug: "recipes/cart-flow" },
						{ label: "Custom types & fields", slug: "recipes/custom-types" },
						{ label: "Fixtures with fishery", slug: "recipes/fixtures" },
					],
				},
				{
					label: "Reference",
					items: [
						{ label: "API coverage & limitations", slug: "reference/resources" },
						{ label: "CommercetoolsMock", slug: "reference/commercetools-mock" },
						{ label: "ProjectAPI", slug: "reference/project-api" },
						{ label: "Storage classes", slug: "reference/storage" },
						{ label: "Errors", slug: "reference/errors" },
					],
				},
			],
		}),
	],
});
