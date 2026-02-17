/* eslint-disable import-x/no-named-as-default-member */
import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginGroupedCssDeclarations from "eslint-plugin-grouped-css-declarations";
import eslintPluginImportX from "eslint-plugin-import-x";
import globals from "globals";
import tseslint from "typescript-eslint";

import eslintPluginCommentLength from "eslint-plugin-comment-length";

export default defineConfig(
  //
  // Global: Configuration
  //
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    ignores: [
      "**/tests/**",
      "**/lib/**/*",
      "**/.next/**/*",
      "**/node_modules/**/*",
      "**/*.json",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
  },

  //
  // Plugins: Base
  //
  eslint.configs.recommended,
  eslintConfigPrettier,

  //
  // Plugin: Typescript
  //
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],

      //
      // We prefer types over interfaces, not the other way around
      //
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/array-type": [
        "error",
        { default: "array-simple", readonly: "array-simple" },
      ],
      "@typescript-eslint/unbound-method": "off",
    },
  },

  //
  // Plugin: import
  //
  eslintPluginImportX.flatConfigs.recommended,
  eslintPluginImportX.flatConfigs.react,
  eslintPluginImportX.flatConfigs.typescript,
  {
    rules: {
      "import-x/default": "off",
      "import-x/no-unresolved": "off", // TypeScript already warns on this category of errors
      "import-x/namespace": "off", // disabled as it is irrelevant with typescript, and very costly performance wise.
      "import-x/no-relative-packages": "error",
      "import-x/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: [
            "**/src/**/testing/**/*",
            "**/src/**/__tests__/**/*",
            "**/src/**/tests/**/*",
            "**/src/**/__stories__/**/*",
            "**/src/**/testing.*",
            "**/src/**/*.story.*",
            "**/.*rc.*",
            "**/cypress.config.ts",
            "**/next.config.js",
            "**/rollup.config*.js",
            "**/webpack*.js",
            "**/dangerfile.js",
            "**/eslint.config.*",
            "**/esbuild.js",
            "**/esbuild.mjs",
          ],
          optionalDependencies: false,
          peerDependencies: false,
          bundledDependencies: false,
        },
      ],
      "import-x/order": [
        "error",
        {
          alphabetize: {
            order: "asc",
          },
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          pathGroups: [
            {
              pattern: "@apps/**",
              group: "internal",
            },
            {
              pattern: "@i-ark/**",
              group: "internal",
            },
            {
              pattern: "@pm2/**",
              group: "internal",
            },
            {
              pattern: "@provider/**",
              group: "internal",
            },
            {
              pattern: "@ui/**",
              group: "internal",
            },
            {
              pattern: "@utils/**",
              group: "internal",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          "newlines-between": "always",
          distinctGroup: false,
        },
      ],
    },
  },

  //
  // Plugin: comment-length
  //
  {
    ...eslintPluginCommentLength.configs["flat/recommended"],
    rules: {
      ...eslintPluginCommentLength.configs["flat/recommended"].rules,
      "comment-length/limit-tagged-template-literal-comments": [
        "warn",
        { tags: ["css"] },
      ],
    },
  },

  //
  // Plugin: grouped-css-declarations
  //
  eslintPluginGroupedCssDeclarations.configs["flat/recommended"],
);
