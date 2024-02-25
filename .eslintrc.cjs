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
	overrides: [
		{
			files: ["**/repositories/**/actions.ts", "**/repositories/*.ts"],
			plugins: ["sort-class-members"],
			rules: {
				"sort-class-members/sort-class-members": [
					2,
					{
						order: [
							"constructor",
							{
								type: "method",
								sort: "alphabetical",
								static: true,
							},
							{
								type: "method",
								sort: "alphabetical",
								abstract: true,
							},
							{
								type: "method",
								sort: "alphabetical",
								accessibility: "public",
							},
							{
								type: "method",
								sort: "alphabetical",
								accessibility: "private",
							},
						],
						accessorPairPositioning: "getThenSet",
					},
				],
			},
		},
	],
};
