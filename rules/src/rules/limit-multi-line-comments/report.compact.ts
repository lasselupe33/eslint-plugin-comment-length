import { TSESTree } from "@typescript-eslint/utils";
import { RuleContext } from "@typescript-eslint/utils/ts-eslint";

import { MessageIds } from "../../const.message-ids";
import { Context } from "../../typings.context";

import { fixOverflowingBlock } from "./fix.overflow";
import { MultilineBlock } from "./typings.block";
import { canBlockBeCompated } from "./util.can-block-be-compacted";

export function reportCompactableBlocks(
  ruleContext: RuleContext<string, unknown[]>,
  baseComment: TSESTree.BlockComment,
  context: Context,
  blocks: MultilineBlock[]
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
