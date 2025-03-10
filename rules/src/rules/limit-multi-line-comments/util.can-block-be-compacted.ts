import type { Context } from "../../typings.context.js";

import type { MultilineBlock } from "./typings.block.js";
import { formatBlock } from "./util.format-block.js";

export function canBlockBeCompated(block: MultilineBlock, context: Context) {
  if (!block.value.trim()) {
    return false;
  }

  const formattedBlock = formatBlock(block, context).trim();
  const formattedLines = formattedBlock.split("\n");

  if (formattedLines.length !== block.lines.length) {
    return true;
  }

  for (let i = 0; i < formattedLines.length; i++) {
    const formattedLine = formattedLines[i]?.replace(/^ *\*/, "").trim();
    const originalLine = block.lines[i]?.trim();

    if (!formattedLine || !originalLine) {
      continue;
    }

    if (formattedLine !== originalLine) {
      return true;
    }
  }

  return false;
}
