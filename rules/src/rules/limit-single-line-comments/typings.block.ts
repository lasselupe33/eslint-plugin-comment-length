import { TSESTree } from "@typescript-eslint/utils";

export type CommentBlock = {
  mergedComment: TSESTree.LineComment | undefined;
  startIndex: number;
  endIndex: number;
};
