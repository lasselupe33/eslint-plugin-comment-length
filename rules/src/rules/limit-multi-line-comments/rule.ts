import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";

import {
  RuleOptions,
  defaultOptions,
  optionsSchema,
} from "../../typings.options";
import { Context } from "../../typings.context";
import { isCodeInComment } from "../../utils/is-code-in-comment";
import { isCommentInComment } from "../../utils/is-comment-in-comment";
import { isJSDocLikeComment } from "../../utils/is-jsdoc-like";
import { isLineOverflowing } from "../../utils/is-line-overflowing";
import { isCommentOnOwnLine } from "../../utils/is-on-own-line";
import { isSemanticComment } from "../../utils/is-semantic-comment";
import { resolveDocsRoute } from "../../utils/resolve-docs-route";

import { fixOverflowingBlock } from "./fix.overflow";
import { Block } from "./typings.block";
import { getBoilerPlateSize } from "./util.boilerplate-size";
import { captureNextBlock } from "./util.capture-next-block";
import { mergeLines } from "./util.merge-lines";

export enum MessageIds {
  EXCEEDS_MAX_LENGTH = "exceeds-max-length",
}

const createRule = ESLintUtils.RuleCreator(resolveDocsRoute);

export const limitMultiLineCommentsRule = createRule<RuleOptions, MessageIds>({
  name: "limit-multi-line-comments",
  defaultOptions,
  meta: {
    type: "layout",
    fixable: "whitespace",
    messages: {
      [MessageIds.EXCEEDS_MAX_LENGTH]:
        "Comments may not exceed {{maxLength}} characters",
    },
    docs: {
      description:
        "Reflows multi-line comments to ensure that blocks never exceed the configured length",
      recommended: "warn",
    },
    schema: optionsSchema,
  },

  create: (ruleContext, [options]) => {
    const sourceCode = ruleContext.getSourceCode();
    const comments = sourceCode.getAllComments();

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

      const blocks = [] as Block[];

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
          context
        );
        blocks.push({
          ...block,
          value: block.lines.reduce((acc, curr) => mergeLines(acc, curr)),
        });
        ignoreFollowingLines = ignoreLines;
      }

      const problematicBlocks = [] as Block[];

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

      for (const fixableBlock of problematicBlocks) {
        ruleContext.report({
          // Ensure we only highlight exactly the block within the multi-line
          // comment which violates the rule.
          loc: {
            start: {
              column: comment.loc.start.column,
              line: comment.loc.start.line + fixableBlock.startIndex,
            },
            end: {
              column: comment.loc.start.column,
              line: comment.loc.start.line + fixableBlock.endIndex + 1,
            },
          },
          messageId: MessageIds.EXCEEDS_MAX_LENGTH,
          data: {
            maxLength: options.maxLength,
          },
          fix: (fixer) => fixOverflowingBlock(fixer, fixableBlock, context),
        });
      }
    }

    return {};
  },
});

function getCommentLines(comment: TSESTree.BlockComment): string[] {
  return comment.value.split("\n").map((it) => it.replace(/^ *?\* ?/, ""));
}
