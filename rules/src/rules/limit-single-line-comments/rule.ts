import { type TSESTree, ESLintUtils } from "@typescript-eslint/utils";

import { MessageIds, reportMessages } from "../../const.message-ids.js";
import {
  type RuleOptions,
  defaultOptions,
  optionsSchema,
} from "../../typings.options.js";
import { resolveDocsRoute } from "../../utils/resolve-docs-route.js";

import { limitSingleLineComments } from "./root.js";

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
    },
    schema: optionsSchema,
  },
  create: (ruleContext, [options]) => {
    const sourceCode = ruleContext.sourceCode;
    const comments = sourceCode
      .getAllComments()
      .filter((it): it is TSESTree.LineComment => it.type === "Line");

    limitSingleLineComments(ruleContext, options, comments);

    return {};
  },
});
