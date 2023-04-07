module.exports = {
  extends: [
    '@labdigital/eslint-config-node',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['unused-imports'],
  rules: {
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        args: 'none',
        argsIgnorePattern: '^_',
      },
    ],
    'unused-imports/no-unused-imports': 'error',
    'arrow-body-style': ['error', 'as-needed'],
    'jest/no-standalone-expect': 'off',
    'jest/no-identical-title': 'off',
    'no-console': [
      'error',
      {
        allow: ['warn', 'error', 'info'],
      },
    ],
  },
}
