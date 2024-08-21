import { ESLintUtils } from "@typescript-eslint/utils";

import { MessageIds, reportMessages } from "../../const.message-ids.js";
import {
  type RuleOptions,
  defaultOptions,
  optionsSchema,
} from "../../typings.options.js";
import { resolveDocsRoute } from "../../utils/resolve-docs-route.js";

import { limitMultiLineComments } from "./root.js";

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
    },
    schema: optionsSchema,
  },

  create: (ruleContext, [options]) => {
    const sourceCode = ruleContext.sourceCode;
    const comments = sourceCode.getAllComments();

    limitMultiLineComments(ruleContext, options, comments);

    return {};
  },
});
