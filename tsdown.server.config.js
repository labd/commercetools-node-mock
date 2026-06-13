import { defineConfig } from "tsdown";

// Standalone server bundle (used by the Docker image).
// Intentionally has no publint/dts: it's an executable bundle, not the
// published package, so it doesn't need type declarations or package.json
// export validation.
export default defineConfig({
	entry: ["src/server.ts"],
	platform: "node",
	format: ["esm"],
	outDir: "dist",
	clean: true,
	splitting: false,
	sourcemap: true,
});
