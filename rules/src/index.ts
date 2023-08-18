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
  },
} satisfies Record<
  string,
  | ESLint.ConfigData<Linter.RulesRecord>
  | Linter.FlatConfig
  | Linter.FlatConfig[]
>;

export default {
  rules,
  configs,
};
