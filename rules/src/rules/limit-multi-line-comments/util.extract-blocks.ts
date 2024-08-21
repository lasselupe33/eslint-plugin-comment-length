import type { Context } from "../../typings.context.js";

import type { MultilineBlock } from "./typings.block.js";
import { captureNextBlock } from "./util.capture-next-block.js";
import { mergeLines } from "./util.merge-lines.js";

export function extractBlocksFromMultilineComment(context: Context) {
  const blocks = [] as MultilineBlock[];

  let ignoreFollowingLines = false;

  // Processing multi-line comments becomes a tad more difficult than simply
  // parsing single-line comments since a single comment may contain
  // multiple logical comment blocks which should be handled individually.
  //
  // Thus our first step is to take a multi-line comment and convert it into
  // logical blocks
  for (let i = 0; i < context.comment.lines.length; i++) {
    if (i <= (blocks[blocks.length - 1]?.endIndex ?? -1)) {
      continue;
    }

    const [block, ignoreLines] = captureNextBlock(
      ignoreFollowingLines,
      i,
      context,
    );
    blocks.push({
      ...block,
      value: block.lines.reduce((acc, curr) => mergeLines(acc, curr)),
    });
    ignoreFollowingLines = ignoreLines;
  }

  return blocks;
}
