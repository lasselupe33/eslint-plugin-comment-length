import { Context } from "../../typings.context";
import { isJSDocLikeComment } from "../../utils/is-jsdoc-like";

import { MultilineBlock } from "./typings.block";
import { formatBlock } from "./util.format-block";

export function canBlockBeCompated(block: MultilineBlock, context: Context) {
  if (!block.value.trim()) {
    return false;
  }
  if (block.lines.some((line) => isJSDocLikeComment(line))) {
    return false;
  }
  const formattedBlock = formatBlock(block, context).trim();
  const doesStartWithAsterisk = formattedBlock.startsWith("*");
  const trimmedComment = doesStartWithAsterisk && context.comment.value.startsWith("*") ? context.comment.value.trim() : context.comment.value.substring(1).trim();
  return formattedBlock !== trimmedComment;
}
