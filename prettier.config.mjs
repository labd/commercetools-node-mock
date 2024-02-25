// Only toplevel prettier config is being read by the editor, that's why this file is here and not in the ui package
// import tailwindcss from "prettier-plugin-tailwindcss";
// import organizeImports from "prettier-plugin-organize-imports";

/** @type {import("prettier").Options} */
export default {
	plugins: ["prettier-plugin-organize-imports", "prettier-plugin-packagejson"],
	quoteProps: "consistent",
	trailingComma: "all", // This is default in 3.0 but the VSCode plugin uses 2.0
	useTabs: true,
};
