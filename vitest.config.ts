import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		testTimeout: 5000,
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts", "vendor/**/*.ts"],
		},
		passWithNoTests: true,
	},
});
