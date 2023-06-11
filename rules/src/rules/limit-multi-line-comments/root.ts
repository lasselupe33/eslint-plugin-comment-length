import { TSESTree } from "@typescript-eslint/utils";
import { RuleContext } from "@typescript-eslint/utils/dist/ts-eslint";

import { Context } from "../../typings.context";
import { Options } from "../../typings.options";
import { isCommentOnOwnLine } from "../../utils/is-on-own-line";
import { isSemanticComment } from "../../utils/is-semantic-comment";

import { detectOverflowInMultilineBlocks } from "./detect.overflow";
import { reportCompactableBlocks } from "./report.compact";
import { reportOverflowingBlocks } from "./report.overflow";
import { getBoilerPlateSize } from "./util.boilerplate-size";
import { extractBlocksFromMultilineComment } from "./util.extract-blocks";

export function limitMultiLineComments(
  ruleContext: RuleContext<string, unknown[]>,
  options: Options,
  comments: TSESTree.Comment[]
) {
  const sourceCode = ruleContext.getSourceCode();

  for (const comment of comments) {
    const commentRange = comment.range;

    if (
      !commentRange ||
      !comment.loc ||
      comment.type !== "Block" ||
      !isCommentOnOwnLine(sourceCode, comment) ||
      isSemanticComment(comment)
    ) {
      continue;
    }

    const commentLines = getCommentLines(comment);
    const context = {
      ...options,
      whitespaceSize: comment.loc?.start.column ?? 0,
      boilerplateSize: getBoilerPlateSize(commentLines),
      comment: {
        range: commentRange,
        lines: commentLines,
        value: comment.value,
      },
    } satisfies Context;

    const blocks = extractBlocksFromMultilineComment(context);
    const overflowingBlocks = detectOverflowInMultilineBlocks(
      ruleContext,
      context,
      blocks
    );

    reportOverflowingBlocks(ruleContext, comment, context, overflowingBlocks);

    const remainingBlocks = blocks.filter(
      (it) => !overflowingBlocks.includes(it)
    );
    reportCompactableBlocks(ruleContext, comment, context, remainingBlocks);
  }
}

function getCommentLines(comment: TSESTree.BlockComment): string[] {
  return comment.value.split("\n").map((it) => it.replace(/^ *?\* ?/, ""));
}
