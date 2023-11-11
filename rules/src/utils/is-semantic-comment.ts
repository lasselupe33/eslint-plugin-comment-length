import { TSESTree } from "@typescript-eslint/utils";

export function isSemanticComment(
  comment: TSESTree.BlockComment | TSESTree.LineComment
): boolean {
  return (
    comment.value.includes("eslint-disable") ||
    comment.value.includes("stylelint-disable") ||
    comment.value.includes("tslint:disable") ||
    comment.value.includes("eslint-enable") ||
    comment.value.includes("stylelint-enable") ||
    comment.value.includes("tslint:enable")
  );
}
