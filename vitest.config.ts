import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		coverage: {
			provider: "v8",
			all: true,
			include: ["src/**/*.ts"],
		},
		passWithNoTests: true,
	},
});
