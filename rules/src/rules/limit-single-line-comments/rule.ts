import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";

import {
  RuleOptions,
  defaultOptions,
  optionsSchema,
} from "../../const.default-options";
import { Context } from "../../typings.context";
import { isCodeInComment } from "../../utils/is-code-in-comment";
import { isCommentInComment } from "../../utils/is-comment-in-comment";
import { isLineOverflowing } from "../../utils/is-line-overflowing";
import { isCommentOnOwnLine } from "../../utils/is-on-own-line";
import { isSemanticComment } from "../../utils/is-semantic-comment";
import { resolveDocsRoute } from "../../utils/resolve-docs-route";

import { SINGLE_LINE_COMMENT_BOILERPLATE_SIZE } from "./const.boilerplate-size";
import { fixOverflow } from "./fix.overflow";
import { captureNearbyComments } from "./util.capture-nearby-comments";
import { captureRelevantComments } from "./util.capture-relevant-comments";

const createRule = ESLintUtils.RuleCreator(resolveDocsRoute);

export enum MessageIds {
  EXCEEDS_MAX_LENGTH = "exceeds-max-length",
}

export const limitSingleLineCommentsRule = createRule<RuleOptions, MessageIds>({
  name: "limit-single-line-comments",
  defaultOptions,
  meta: {
    type: "layout",
    fixable: "whitespace",
    messages: {
      [MessageIds.EXCEEDS_MAX_LENGTH]:
        "Comments may not exceed {{maxLength}} characters",
    },
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

    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];

      if (!comment?.range || !comment.value) {
        continue;
      }

      let context = {
        ...options,
        whitespaceSize: comment?.loc?.start.column ?? 0,
        boilerplateSize: SINGLE_LINE_COMMENT_BOILERPLATE_SIZE,
        comment: {
          range: comment.range,
          lines: [comment.value],
          value: comment.value,
        },
      } satisfies Context;

      if (
        comment &&
        comment.loc &&
        comment.type === "Line" &&
        isLineOverflowing(comment.value, context) &&
        !isSemanticComment(comment) &&
        isCommentOnOwnLine(sourceCode, comment)
      ) {
        const fixableComment = captureRelevantComments(
          sourceCode,
          comments,
          i,
          context
        );

        if (!fixableComment) {
          continue;
        }

        context = {
          ...context,
          comment: {
            range: fixableComment.range,
            lines: [fixableComment.value],
            value: fixableComment.value,
          },
        };

        if (
          isCommentInComment(fixableComment.value) ||
          isCodeInComment(
            captureNearbyComments(comments, i)?.value,
            ruleContext.parserPath,
            context
          )
        ) {
          continue;
        }

        ruleContext.report({
          loc: comment.loc,
          messageId: MessageIds.EXCEEDS_MAX_LENGTH,
          data: {
            maxLength: context.maxLength,
          },
          fix: (fixer) => fixOverflow(fixer, fixableComment, context),
        });
      }
    }

    return {};
  },
});
