import { TSESTree } from "@typescript-eslint/utils";

import { mergeComments } from "./util.merge-comments";

export function captureNearbyComments(
  comments: TSESTree.LineComment[],
  startIndex: number
): TSESTree.LineComment | undefined {
  let comment = comments[startIndex];

  if (!comment) {
    return;
  }

  // Previous comments
  for (let i = startIndex - 1; i >= 0; i--) {
    const prevComment = comments[i];

    if (
      !prevComment ||
      (prevComment.loc?.end.line ?? 0) + 1 !== comment.loc?.start.line
    ) {
      break;
    }

    comment = mergeComments(prevComment, comment, "\n");
  }

  // Following comments
  for (let i = startIndex + 1; i < comments.length; i++) {
    const nextComment = comments[i];

    if (
      !nextComment ||
      nextComment.loc?.start.line !== (comment.loc?.end.line ?? 0) + 1
    ) {
      break;
    }

    comment = mergeComments(comment, nextComment, "\n");
  }

  return comment;
}
