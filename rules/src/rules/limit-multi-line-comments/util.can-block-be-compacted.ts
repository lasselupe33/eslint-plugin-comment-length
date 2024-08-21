import type { Context } from "../../typings.context.js";

import type { MultilineBlock } from "./typings.block.js";
import { formatBlock } from "./util.format-block.js";

export function canBlockBeCompated(block: MultilineBlock, context: Context) {
  if (!block.value.trim()) {
    return false;
  }

  const formattedBlock = formatBlock(block, context).trim();

  return formattedBlock !== context.comment.value.trim();
}
