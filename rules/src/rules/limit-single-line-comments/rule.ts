import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";

import { Context } from "../../typings.context";
import {
  RuleOptions,
  defaultOptions,
  optionsSchema,
} from "../../typings.options";
import { isCodeInComment } from "../../utils/is-code-in-comment";
import { isCommentInComment } from "../../utils/is-comment-in-comment";
import { isLineOverflowing } from "../../utils/is-line-overflowing";
import { isCommentOnOwnLine } from "../../utils/is-on-own-line";
import { isSemanticComment } from "../../utils/is-semantic-comment";
import { resolveDocsRoute } from "../../utils/resolve-docs-route";

import { SINGLE_LINE_COMMENT_BOILERPLATE_SIZE } from "./const.boilerplate-size";
import { fixOverflow } from "./fix.overflow";
import { canBlockBeCompated } from "./util.can-block-be-compacted";
import { captureNearbyComments } from "./util.capture-nearby-comments";
import { captureRelevantCommentsIntoBlock } from "./util.capture-relevant-comments";

const createRule = ESLintUtils.RuleCreator(resolveDocsRoute);

export enum MessageIds {
  EXCEEDS_MAX_LENGTH = "exceeds-max-length",
  CAN_COMPACT = "can-compact",
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
      [MessageIds.CAN_COMPACT]:
        "It is possible to make the current comment block more compact",
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
      const currentCommentLine = comments[i];

      if (
        !currentCommentLine?.range ||
        !currentCommentLine.value ||
        !isCommentOnOwnLine(sourceCode, currentCommentLine) ||
        isSemanticComment(currentCommentLine)
      ) {
        continue;
      }

      let context = {
        ...options,
        whitespaceSize: currentCommentLine?.loc?.start.column ?? 0,
        boilerplateSize: SINGLE_LINE_COMMENT_BOILERPLATE_SIZE,
        comment: {
          range: currentCommentLine.range,
          lines: [currentCommentLine.value],
          value: currentCommentLine.value,
        },
      } satisfies Context;

      const currentBlock = captureRelevantCommentsIntoBlock(
        sourceCode,
        comments,
        i,
        context
      );
      const fixableComment = currentBlock.mergedComment;

      // ensure that we only visit a captured block once
      i += currentBlock.endIndex - currentBlock.startIndex;

      if (
        !fixableComment ||
        isCommentInComment(fixableComment.value) ||
        isCodeInComment(
          captureNearbyComments(comments, i)?.value,
          ruleContext.parserPath,
          context
        )
      ) {
        continue;
      }

      // Update our context to reflect that we may have merged multiple comment
      // lines into a singular block.
      context = {
        ...context,
        comment: {
          range: fixableComment.range,
          lines: [fixableComment.value],
          value: fixableComment.value,
        },
      };

      // In case any lines in our current block overflows, then we need to warn
      // that overflow has been detected
      if (
        comments
          .slice(currentBlock.startIndex, currentBlock.endIndex + 1)
          .some((line) => isLineOverflowing(line.value, context))
      ) {
        ruleContext.report({
          loc: fixableComment.loc,
          messageId: MessageIds.EXCEEDS_MAX_LENGTH,
          data: {
            maxLength: context.maxLength,
          },
          fix: (fixer) => fixOverflow(fixer, fixableComment, context),
        });
      } else if (
        context.mode === "compact" &&
        canBlockBeCompated(comments, currentBlock, context)
      ) {
        ruleContext.report({
          loc: fixableComment.loc,
          messageId: MessageIds.CAN_COMPACT,
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
