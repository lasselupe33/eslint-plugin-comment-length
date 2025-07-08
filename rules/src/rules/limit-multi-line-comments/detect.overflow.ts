import type { RuleContext } from "@typescript-eslint/utils/ts-eslint";

import type { Context } from "../../typings.context.js";
import { isLineOverflowing } from "../../utils/is-line-overflowing.js";

import type { MultilineBlock } from "./typings.block.js";

export function detectOverflowInMultilineBlocks(
  _ruleContext: RuleContext<string, unknown[]>,
  context: Context,
  blocks: MultilineBlock[],
) {
  const problematicBlocks = [] as MultilineBlock[];

  // ... and then we can go through each block to determine if it violates
  // our rule to mark it as fixable using logic similar to the single-line
  // rule.
  for (const block of blocks) {
    for (let i = 0; i < block.lines.length; i++) {
      const line = block.lines[i];

      if (line && isLineOverflowing(line, context)) {
        problematicBlocks.push(block);
        break;
      }
    }
  }

  return problematicBlocks;
}
