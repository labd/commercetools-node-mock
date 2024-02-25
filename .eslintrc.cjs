module.exports = {
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
	plugins: ["unused-imports"],
	parserOptions: {
		project: "tsconfig.json",
		tsconfigRootDir: __dirname,
	},
	rules: {
		"@typescript-eslint/ban-ts-comment": "off",
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-empty-function": "off",
		"@typescript-eslint/no-non-null-assertion": "off",
		"@typescript-eslint/no-unused-vars": [
			"warn",
			{
				args: "none",
				argsIgnorePattern: "^_",
			},
		],
		//
		"lines-between-class-members": ["error"],
		"unused-imports/no-unused-imports": "error",
		"arrow-body-style": ["error", "as-needed"],
		"no-mixed-spaces-and-tabs": 0,
		"no-console": [
			"error",
			{
				allow: ["warn", "error", "info"],
			},
		],
	},
};
