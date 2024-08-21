import type { TSESTree } from "@typescript-eslint/utils";
import type { RuleContext } from "@typescript-eslint/utils/ts-eslint";

import { MessageIds } from "../../const.message-ids.js";
import type { Context } from "../../typings.context.js";

import { fixOverflowingBlock } from "./fix.overflow.js";
import { type MultilineBlock } from "./typings.block.js";
import { canBlockBeCompated } from "./util.can-block-be-compacted.js";

export function reportCompactableBlocks(
  ruleContext: RuleContext<string, unknown[]>,
  baseComment: TSESTree.BlockComment,
  context: Context,
  blocks: MultilineBlock[],
) {
  if (context.mode !== "compact") {
    return;
  }

  for (const block of blocks) {
    if (!canBlockBeCompated(block, context)) {
      continue;
    }

    ruleContext.report({
      loc: {
        start: {
          column: 0,
          line: baseComment.loc.start.line + block.startIndex,
        },
        end: {
          column:
            baseComment.loc.start.column +
            context.boilerplateSize +
            (block.lines.at(-1)?.length ?? 0),
          line: baseComment.loc.start.line + block.endIndex,
        },
      },
      messageId: MessageIds.CAN_COMPACT,
      data: {
        maxLength: context.maxLength,
      },
      fix: (fixer) => fixOverflowingBlock(fixer, block, context),
    });
  }
}
