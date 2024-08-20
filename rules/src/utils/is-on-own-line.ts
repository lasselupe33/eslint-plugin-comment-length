import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

export function isCommentOnOwnLine(
  sourceCode: TSESLint.SourceCode,
  comment: TSESTree.BlockComment | TSESTree.LineComment,
): boolean {
  const previousToken = sourceCode.getTokenBefore(comment);
  const nextToken = sourceCode.getTokenAfter(comment);

  return (
    previousToken?.loc.end.line !== comment.loc?.start.line &&
    nextToken?.loc.start.line !== comment.loc?.end.line
  );
}
