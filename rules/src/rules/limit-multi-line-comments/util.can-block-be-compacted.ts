import { Context } from "../../typings.context";

import { MultilineBlock } from "./typings.block";
import { formatBlock } from "./util.format-block";

export function canBlockBeCompated(block: MultilineBlock, context: Context) {
  if (!block.value.trim()) {
    return false;
  }

  const formattedBlock = formatBlock(block, context).trim();

  return formattedBlock !== context.comment.value.trim();
}
