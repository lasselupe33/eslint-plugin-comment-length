import type { TSESTree } from "@typescript-eslint/utils";

import { type Context } from "../../typings.context.js";
import { isURL } from "../../utils/is-url.js";

import type { CommentBlock } from "./typings.block.js";

export function canBlockBeCompated(
  comments: TSESTree.LineComment[],
  block: CommentBlock,
  context: Context,
): boolean {
  for (let i = block.startIndex + 1; i <= block.endIndex; i++) {
    const prev = comments[i - 1];
    const curr = comments[i];

    if (!prev || !curr || (context.ignoreUrls && isURL(curr?.value))) {
      continue;
    }

    const firstWordOnCurrentLine = curr.value.trim().split(" ")[0];
    const lengthOfPrevLine =
      prev.value.length + context.boilerplateSize + context.whitespace.size + 1;

    if (
      lengthOfPrevLine + 1 + (firstWordOnCurrentLine?.length ?? 0) <=
      context.maxLength
    ) {
      return true;
    }
  }

  return false;
}
