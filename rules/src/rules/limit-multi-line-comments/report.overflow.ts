import { TSESTree } from "@typescript-eslint/utils";
import { RuleContext } from "@typescript-eslint/utils/ts-eslint";

import { MessageIds } from "../../const.message-ids";
import { Context } from "../../typings.context";

import { fixOverflowingBlock } from "./fix.overflow";
import { MultilineBlock } from "./typings.block";

export function reportOverflowingBlocks(
  ruleContext: RuleContext<string, unknown[]>,
  baseComment: TSESTree.BlockComment,
  context: Context,
  overflowingBlocks: MultilineBlock[]
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
