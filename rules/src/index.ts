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

const plugin = {
  meta: {
    name: "eslint-plugin-comment-length",
    version: "2.0.0",
  },
  rules,
};

export const configs = {
  recommended: {
    plugins: ["comment-length"],
    rules: {
      "comment-length/limit-single-line-comments": ["warn"],
      "comment-length/limit-multi-line-comments": ["warn"],
    },
  } satisfies ESLint.ConfigData,

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
      "comment-length": plugin,
    },
    rules: {
      "comment-length/limit-single-line-comments": ["warn"],
      "comment-length/limit-multi-line-comments": ["warn"],
    },
  } satisfies Linter.Config,
} as const;

export default {
  meta: {
    name: "eslint-plugin-comment-length",
    version: "2.0.0",
  },
  rules,
  configs,
};
