import type { TSESTree } from "@typescript-eslint/utils";
import type { RuleContext } from "@typescript-eslint/utils/ts-eslint";

import { MessageIds } from "../../const.message-ids.js";
import type { Context } from "../../typings.context.js";

import { fixOverflowingBlock } from "./fix.overflow.js";
import type { MultilineBlock } from "./typings.block.js";

export function reportOverflowingBlocks(
  ruleContext: RuleContext<string, unknown[]>,
  baseComment: TSESTree.BlockComment,
  context: Context,
  overflowingBlocks: MultilineBlock[],
) {
  for (const fixableBlock of overflowingBlocks) {
    ruleContext.report({
      // Ensure we only highlight exactly the block within the multi-line
      // comment which violates the rule.
      loc: {
        start: {
          column: 0,
          line: baseComment.loc.start.line + fixableBlock.startIndex,
        },
        end: {
          column:
            baseComment.loc.start.column +
            context.boilerplateSize +
            (fixableBlock.lines.at(-1)?.length ?? 0),
          line: baseComment.loc.start.line + fixableBlock.endIndex,
        },
      },
      messageId: MessageIds.EXCEEDS_MAX_LENGTH,
      data: {
        maxLength: context.maxLength,
      },
      fix: (fixer) => fixOverflowingBlock(fixer, fixableBlock, context),
    });
  }
}
