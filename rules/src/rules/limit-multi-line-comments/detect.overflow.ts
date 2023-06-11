import { RuleContext } from "@typescript-eslint/utils/dist/ts-eslint";

import { Context } from "../../typings.context";
import { isCodeInComment } from "../../utils/is-code-in-comment";
import { isCommentInComment } from "../../utils/is-comment-in-comment";
import { isJSDocLikeComment } from "../../utils/is-jsdoc-like";
import { isLineOverflowing } from "../../utils/is-line-overflowing";

import { MultilineBlock } from "./typings.block";

export function detectOverflowInMultilineBlocks(
  ruleContext: RuleContext<string, unknown[]>,
  context: Context,
  blocks: MultilineBlock[]
) {
  const problematicBlocks = [] as MultilineBlock[];

  // ... and then we can go through each block to determine if it violates
  // our rule to mark it as fixable using logic similar to the single-line
  // rule.
  for (const block of blocks) {
    for (let i = 0; i < block.lines.length; i++) {
      const line = block.lines[i];

      if (line && isLineOverflowing(line, context)) {
        // Even though a line is overflowing, then it might need to be
        // ignored in some cases where it is likely the intent that it
        // should overflow.
        if (
          block.lines.some(
            (line) => isCommentInComment(line) || isJSDocLikeComment(line)
          ) ||
          isCodeInComment(block.value, ruleContext.parserPath, context)
        ) {
          continue;
        }

        problematicBlocks.push(block);
        break;
      }
    }
  }

  return problematicBlocks;
}
