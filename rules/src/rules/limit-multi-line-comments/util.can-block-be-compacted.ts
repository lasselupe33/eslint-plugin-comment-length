import { Context } from "../../typings.context";
import { isURL } from "../../utils/is-url";

import { MultilineBlock } from "./typings.block";

export function canBlockBeCompated(block: MultilineBlock, context: Context) {
  for (let i = 1; i < block.lines.length; i++) {
    const prev = block.lines[i - 1];
    const curr = block.lines[i];

    if (!prev || !curr || (context.ignoreUrls && isURL(curr))) {
      continue;
    }

    const firstWordOnCurrentLine = curr.trim().split(" ")[0];
    const lengthOfPrevLine =
      prev.length + context.boilerplateSize + context.whitespaceSize + 1;

    if (
      lengthOfPrevLine + 1 + (firstWordOnCurrentLine?.length ?? 0) + 1 <=
      context.maxLength
    ) {
      return true;
    }
  }

  return false;
}
