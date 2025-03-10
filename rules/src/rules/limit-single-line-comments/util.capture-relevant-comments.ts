import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import type { Context } from "../../typings.context.js";
import { isLineOverflowing } from "../../utils/is-line-overflowing.js";
import { isCommentOnOwnLine } from "../../utils/is-on-own-line.js";
import { isSemanticComment } from "../../utils/is-semantic-comment.js";

import type { CommentBlock } from "./typings.block.js";
import { mergeComments } from "./util.merge-comments.js";

export function captureRelevantCommentsIntoBlock(
  sourceCode: TSESLint.SourceCode,
  comments: TSESTree.LineComment[],
  startIndex: number,
  context: Context,
): CommentBlock {
  let comment = comments[startIndex];

  if (!comment) {
    return { mergedComment: undefined, startIndex, endIndex: startIndex };
  }

  let endIndex = startIndex;

  for (let i = startIndex + 1; i < comments.length; i++) {
    const nextComment = comments[i];

    if (
      (context.mode === "overflow-only" &&
        !isLineOverflowing(comment.value, context)) ||
      !nextComment ||
      nextComment.value.trim() === "" ||
      nextComment.loc?.start.line !== (comment.loc?.end.line ?? 0) + 1 ||
      isSemanticComment(nextComment, context.semanticComments) ||
      !isCommentOnOwnLine(sourceCode, nextComment)
    ) {
      break;
    }

    comment = mergeComments(comment, nextComment);
    endIndex = i;
  }

  return { mergedComment: comment, startIndex, endIndex };
}
