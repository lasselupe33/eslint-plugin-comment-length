import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginCommentLength from "eslint-plugin-comment-length";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";

/**
 * ESLint config.
 * @satisfies {Array<import("eslint").Linter.Config>}
 */
const eslintConfig = [
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    ignores: [
      "**/tests/**/*",
      "**/lib/**/*",
      "**/node_modules/**/*",
      "**/*.json",
      "!.husky",
    ],
  },
  eslintPluginCommentLength.configs["flat/recommended"],
  eslintConfigPrettier,
];

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...eslintConfig,
);
