import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";

import { MessageIds, reportMessages } from "../../const.message-ids";
import {
  RuleOptions,
  defaultOptions,
  optionsSchema,
} from "../../typings.options";
import { resolveDocsRoute } from "../../utils/resolve-docs-route";

import { limitSingleLineComments } from "./root";

const createRule = ESLintUtils.RuleCreator(resolveDocsRoute);

export const limitSingleLineCommentsRule = createRule<RuleOptions, MessageIds>({
  name: "limit-single-line-comments",
  defaultOptions,
  meta: {
    type: "layout",
    fixable: "whitespace",
    messages: reportMessages,
    docs: {
      description:
        "Reflows single-line comments to ensure that blocks never exceed the configured length",
      recommended: "warn",
    },
    schema: optionsSchema,
  },
  create: (ruleContext, [options]) => {
    const sourceCode = ruleContext.getSourceCode();
    const comments = sourceCode
      .getAllComments()
      .filter((it): it is TSESTree.LineComment => it.type === "Line");

    limitSingleLineComments(ruleContext, options, comments);

    return {};
  },
});
