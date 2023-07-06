import { TSESTree } from "@typescript-eslint/utils";

import { Context } from "../../typings.context";

import { CommentBlock } from "./typings.block";
import { formatBlock } from "./util.format-block";

export function canBlockBeCompated(
  comments: TSESTree.LineComment[],
  block: CommentBlock,
  context: Context
): boolean {
  if (!block.mergedComment) {
    return false;
  }
  const formattedBlock = formatBlock(block.mergedComment, context);
  let currentBlock = "";
  for (let i = block.startIndex; i <= block.endIndex; i++) {
    currentBlock +=
      context.whitespace.string + "//" + comments[i]!.value + "\n";
  }

  return formattedBlock.trim() !== currentBlock.trim();
}
