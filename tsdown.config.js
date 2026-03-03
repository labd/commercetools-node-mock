import { defineConfig } from "tsdown";

export default defineConfig([
	{
		entry: ["src/index.ts", "src/storage/sqlite.ts"],
		clean: true,
		splitting: false,
		dts: true,
		sourcemap: true,
		format: ["esm"],
		outDir: "dist",
	},
]);
