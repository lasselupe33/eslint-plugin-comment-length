import type { ESLint, Linter, Rule } from "eslint";

import { limitMultiLineCommentsRule } from "./rules/limit-multi-line-comments/rule";
import { limitSingleLineCommentsRule } from "./rules/limit-single-line-comments/rule";
import { limitTaggedTemplateLiteralCommentsRule } from "./rules/limit-tagged-template-literal-comments/rule";

export const rules = {
  "limit-single-line-comments": limitSingleLineCommentsRule,
  "limit-multi-line-comments": limitMultiLineCommentsRule,
  "limit-tagged-template-literal-comments":
    limitTaggedTemplateLiteralCommentsRule,
} as unknown as Record<string, Rule.RuleModule>;

export const configs = {
  recommended: {
    plugins: ["comment-length"],
    rules: {
      "comment-length/limit-single-line-comments": ["warn"],
      "comment-length/limit-multi-line-comments": ["warn"],
    },
  } satisfies ESLint.ConfigData<Linter.RulesRecord>,

  "flat/recommended": {
    files: [
      "**/*.js",
      "**/*.mjs",
      "**/*.jsx",
      "**/*.ts",
      "**/*.mts",
      "**/*.tsx",
    ],
    plugins: {
      "comment-length": require("."),
    },
    rules: {
      "comment-length/limit-single-line-comments": ["warn"],
      "comment-length/limit-multi-line-comments": ["warn"],
    },
  } satisfies Linter.FlatConfig,
} as const;

export default {
  rules,
  configs,
};
