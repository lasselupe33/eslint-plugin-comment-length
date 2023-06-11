import { ESLintUtils } from "@typescript-eslint/utils";

import { MessageIds, reportMessages } from "../../const.message-ids";
import {
  RuleOptions,
  defaultOptions,
  optionsSchema,
} from "../../typings.options";
import { resolveDocsRoute } from "../../utils/resolve-docs-route";

import { limitMultiLineComments } from "./root";

const createRule = ESLintUtils.RuleCreator(resolveDocsRoute);

export const limitMultiLineCommentsRule = createRule<RuleOptions, MessageIds>({
  name: "limit-multi-line-comments",
  defaultOptions,
  meta: {
    type: "layout",
    fixable: "whitespace",
    messages: reportMessages,
    docs: {
      description:
        "Reflows multi-line comments to ensure that blocks never exceed the configured length",
      recommended: "warn",
    },
    schema: optionsSchema,
  },

  create: (ruleContext, [options]) => {
    const sourceCode = ruleContext.getSourceCode();
    const comments = sourceCode.getAllComments();

    limitMultiLineComments(ruleContext, options, comments);

    return {};
  },
});
