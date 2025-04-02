import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    // Global ignores
    ignores: [
      'node_modules/',
      'dist/',
      'docs/.vitepress/cache/',
      'docs/api/generated/',
      'coverage/',
    ],
  },
  {
    // Configuration for JS/CJS files (like config files)
    files: ['*.{js,cjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Add specific rules for JS/CJS if needed
    },
  },
  {
    // Configuration for TS/TSX source files (project-aware)
    files: ['src/**/*.{ts,tsx}', 'react-adapter/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json', // Link to tsconfig for type-aware rules
      },
      globals: {
        ...globals.es2021,
        ...globals.browser, // Add browser globals for react adapter tests
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs.recommendedTypeChecked?.rules, // Add type-checked rules
      ...eslintConfigPrettier.rules,
      'prettier/prettier': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn', // TODO: Re-enable and fix 'any' types
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Configuration for TS config files (no project linking)
    files: ['*.config.ts'], // Target tsup.config.ts, vitest.config.ts etc.
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: eslintPluginPrettier,
    },
    rules: {
      // Apply a subset of rules, excluding project-specific ones
      ...tseslint.configs.recommended.rules,
      ...eslintConfigPrettier.rules,
      'prettier/prettier': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn', // TODO: Re-enable and fix 'any' types
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // Disable rules that require type info if they cause issues
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  // Include eslint:recommended rules globally (can be refined)
  // Note: eslint:recommended is implicitly included in newer flat configs,
  // but explicitly adding parts might be needed if defaults change.
  // For now, relying on @typescript-eslint/recommended which includes many core rules.
];
