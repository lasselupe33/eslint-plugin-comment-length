import { TSESTree } from "@typescript-eslint/utils";

import { deepCloneValue } from "../../utils/immutable-deep-merge";

export function mergeComments(
  a: TSESTree.LineComment,
  b: TSESTree.LineComment,
  separator = " ",
): TSESTree.LineComment {
  const newComment = deepCloneValue(a);

  newComment.value = `${a.value.trim()}${separator}${b.value.trim()}`;

  if (newComment.loc && b.loc) {
    newComment.loc.end = b.loc.end;
  }

  if (newComment.range && b.range) {
    newComment.range[1] = b.range[1];
  }

  return newComment;
}
