import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		testTimeout: 5000,
		coverage: {
			provider: "v8",
			all: true,
			include: ["src/**/*.ts", "vendor/**/*.ts"],
		},
		passWithNoTests: true,
	},
	resolve: {
		alias: {
			"~src": path.join(__dirname, "src"),
			"~vendor": path.join(__dirname, "vendor"),
		},
	},
});
