import type { TSESTree } from "@typescript-eslint/utils";
import type { RuleContext } from "@typescript-eslint/utils/ts-eslint";

import type { Context } from "../../typings.context.js";
import type { Options } from "../../typings.options.js";
import { isCodeInComment } from "../../utils/is-code-in-comment.js";
import { isCommentInComment } from "../../utils/is-comment-in-comment.js";
import { isJSDocLikeComment } from "../../utils/is-jsdoc-like.js";
import { isCommentOnOwnLine } from "../../utils/is-on-own-line.js";
import { isSemanticComment } from "../../utils/is-semantic-comment.js";

import { detectOverflowInMultilineBlocks } from "./detect.overflow.js";
import { reportCompactableBlocks } from "./report.compact.js";
import { reportOverflowingBlocks } from "./report.overflow.js";
import { getBoilerPlateSize } from "./util.boilerplate-size.js";
import { extractBlocksFromMultilineComment } from "./util.extract-blocks.js";

export function limitMultiLineComments(
  ruleContext: RuleContext<string, unknown[]>,
  options: Options,
  comments: TSESTree.Comment[],
) {
  const sourceCode = ruleContext.sourceCode;
  const lines = sourceCode.getLines();

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

    const whitespaceString = (() => {
      const firstLine = lines[comment.loc.start.line - 1];
      const lastLine = lines[comment.loc.end.line - 1];

      if (
        comment.loc.start.line === comment.loc.end.line ||
        (lastLine && !/^( |\t)*\*\//.test(lastLine))
      ) {
        return firstLine?.split("/*")[0] ?? "";
      }

      return lastLine?.split(" */")[0] ?? firstLine?.split("/*")[0] ?? "";
    })();

    const commentLines = getCommentLines(comment);
    const context = {
      ...options,
      whitespace: {
        string: whitespaceString,
        size: whitespaceString
          .split("")
          .reduce(
            (acc, curr) => acc + (curr === "\t" ? options.tabSize : 1),
            0,
          ),
      },
      boilerplateSize: getBoilerPlateSize(commentLines),
      comment: {
        range: commentRange,
        lines: commentLines,
        value: comment.value,
      },
    } satisfies Context;

    // Extract all valid blocks, but immediately remove those that should be
    // ignored no matter what.
    const blocks = extractBlocksFromMultilineComment(context).filter(
      (block) =>
        !block.lines.some(
          (line) => isCommentInComment(line) || isJSDocLikeComment(line),
        ) && !isCodeInComment(block.value, context),
    );

    const overflowingBlocks = detectOverflowInMultilineBlocks(
      ruleContext,
      context,
      blocks,
    );

    reportOverflowingBlocks(ruleContext, comment, context, overflowingBlocks);

    const remainingBlocks = blocks.filter(
      (it) => !overflowingBlocks.includes(it),
    );
    reportCompactableBlocks(ruleContext, comment, context, remainingBlocks);
  }
}

function getCommentLines(comment: TSESTree.BlockComment): string[] {
  return comment.value.split("\n").map((it) => it.replace(/^( |\t)*?\*/, ""));
}
