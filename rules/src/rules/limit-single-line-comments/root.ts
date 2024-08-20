import type { TSESTree } from "@typescript-eslint/utils";
import type { RuleContext } from "@typescript-eslint/utils/ts-eslint";

import { MessageIds } from "../../const.message-ids";
import type { Context } from "../../typings.context";
import type { Options } from "../../typings.options";
import { isCodeInComment } from "../../utils/is-code-in-comment";
import { isCommentInComment } from "../../utils/is-comment-in-comment";
import { isLineOverflowing } from "../../utils/is-line-overflowing";
import { isCommentOnOwnLine } from "../../utils/is-on-own-line";
import { isSemanticComment } from "../../utils/is-semantic-comment";

import { SINGLE_LINE_COMMENT_BOILERPLATE_SIZE } from "./const.boilerplate-size";
import { fixOverflow } from "./fix.overflow";
import { canBlockBeCompated } from "./util.can-block-be-compacted";
import { captureNearbyComments } from "./util.capture-nearby-comments";
import { captureRelevantCommentsIntoBlock } from "./util.capture-relevant-comments";

export function limitSingleLineComments(
  ruleContext: RuleContext<string, unknown[]>,
  options: Options,
  comments: TSESTree.LineComment[],
) {
  const sourceCode = ruleContext.sourceCode;
  const lines = sourceCode.getLines();

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

    const line = lines[currentCommentLine.loc.start.line - 1];
    const whitespaceString = line?.split("//")[0] ?? "";

    let context = {
      ...options,
      whitespace: {
        string: whitespaceString,
        size: whitespaceString
          .split("")
          .reduce(
            (acc, curr) => acc + (curr === "\t" ? options.tabSize : 1),
            0,
          ),
      },
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
      context,
    );
    const fixableComment = currentBlock.mergedComment;

    // ensure that we only visit a captured block once
    i += currentBlock.endIndex - currentBlock.startIndex;

    const nearbyComments = captureNearbyComments(comments, i);
    const wrappedByBackticks =
      (nearbyComments?.value.trimStart().startsWith("` ") ||
        nearbyComments?.value.trimStart().startsWith("``")) &&
      nearbyComments?.value.trimEnd().endsWith("`");

    if (
      !fixableComment ||
      wrappedByBackticks ||
      isCommentInComment(fixableComment.value) ||
      isCodeInComment(nearbyComments?.value, context)
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
}
