import { TSESLint, TSESTree } from "@typescript-eslint/utils";

import { Context } from "../../typings.context";
import { isLineOverflowing } from "../../utils/is-line-overflowing";
import { isCommentOnOwnLine } from "../../utils/is-on-own-line";
import { isSemanticComment } from "../../utils/is-semantic-comment";

import { mergeComments } from "./util.merge-comments";

export function captureRelevantComments(
  sourceCode: TSESLint.SourceCode,
  comments: TSESTree.LineComment[],
  startIndex: number,
  context: Context
): TSESTree.LineComment | undefined {
  let comment = comments[startIndex];

  if (!comment) {
    return;
  }

  for (let i = startIndex + 1; i < comments.length; i++) {
    const nextComment = comments[i];

    if (
      !nextComment ||
      nextComment.value.trim() === "" ||
      nextComment.loc?.start.line !== (comment.loc?.end.line ?? 0) + 1 ||
      isSemanticComment(nextComment) ||
      !isCommentOnOwnLine(sourceCode, nextComment)
    ) {
      break;
    }

    comment = mergeComments(comment, nextComment);

    if (
      !isLineOverflowing(
        nextComment.value + (comments[i + 1]?.value.trim().split(" ")[0] ?? ""),
        context
      )
    ) {
      break;
    }
  }

  return comment;
}
