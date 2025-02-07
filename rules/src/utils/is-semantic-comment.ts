import { TSESTree } from "@typescript-eslint/utils";

export function isSemanticComment(
  comment: TSESTree.BlockComment | TSESTree.LineComment,
  semanticComments?: string[],
): boolean {
  const includesCustomSemanticComment =
    semanticComments?.some((semanticComment) =>
      comment.value.includes(semanticComment),
    ) || false;

  return (
    comment.value.includes("eslint-disable") ||
    comment.value.includes("stylelint-disable") ||
    comment.value.includes("tslint:disable") ||
    comment.value.includes("eslint-enable") ||
    comment.value.includes("stylelint-enable") ||
    comment.value.includes("tslint:enable") ||
    includesCustomSemanticComment
  );
}
