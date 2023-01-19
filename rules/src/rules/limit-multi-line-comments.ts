// eslint-disable-next-line import/no-extraneous-dependencies
import { Linter, Rule, SourceCode } from "eslint";
import { Comment } from "estree";

import { Options } from "../classes/Options";
import { isURL } from "../utils/utils";

const SINGLE_LINE_BOILERPLATE_SIZE = 6; // i.e. '/*'.length + '*/'.length
const MULTILINE_BOILERPLATE_SIZE = 3; // i.e. '/*'.length OR '*/'.length OR ' *'.length

export const limitMultiLineCommentsRule: Rule.RuleModule = {
  meta: {
    type: "layout",
    fixable: "whitespace",
  },

  create: (context: Rule.RuleContext): Rule.RuleListener => {
    // The options object must be the last option specified
    const specifiedOptions = context.options[context.options.length - 1];
    const options = new Options(specifiedOptions);
    const { maxLength, ignoreUrls } = options;

    const sourceCode = context.getSourceCode();
    const comments = sourceCode.getAllComments();

    for (const comment of comments) {
      const commentRange = comment.range;

      if (
        !commentRange ||
        !comment.loc ||
        comment.type !== "Block" ||
        !isCommentOnOwnLine(sourceCode, comment) ||
        isSpecialComment(comment)
      ) {
        continue;
      }

      const whitespaceSize = comment.loc?.start.column ?? 0;
      const lines = getCommentLines(comment);

      const blocks: Array<{
        lines: string[];
        lineOffsets: number[];
        startIndex: number;
        endIndex: number;
      }> = [];

      // Processing multi-line comments becomes a tad more difficult than simply
      // parsing single-line comments since a single comment may contain
      // multiple logical comment blocks which should be handled individually.
      //
      // Thus our first step is to take a multi-line comment and convert it into
      // logical blocks
      for (let i = 0; i < lines.length; i++) {
        if (i < (blocks[blocks.length - 1]?.endIndex ?? -1)) {
          continue;
        }

        const block = captureNextBlock(lines, i, {
          maxLength,
          whitespaceSize,
          boilerplateSize: getBoilerPlateSize(lines),
          ignoreUrls,
        });
        blocks.push(block);
      }

      const problematicBlocks: Array<{
        value: string;
        lineOffsets: number[];
        startIndex: number;
        endIndex: number;
      }> = [];

      // ... and then we can go through each block to determine if it violates
      // our rule to mark it as fixable using logic similar to the single-line
      // rule.
      for (const block of blocks) {
        for (let i = 0; i < block.lines.length; i++) {
          const line = block.lines[i];

          if (
            line &&
            isLineOverflowing(line, {
              maxLength,
              whitespaceSize,
              boilerplateSize: getBoilerPlateSize(lines),
              ignoreUrls,
            })
          ) {
            const mergedLines = block.lines.reduce((acc, curr) =>
              mergeLines(acc, curr)
            );

            // Even though a line is overflowing, then it might need to be
            // ignored in some cases where it is likely the intent that it
            // should overflow.
            if (
              block.lines.some(
                (line) => isCommentInComment(line) || isJSDocLikeComment(line)
              ) ||
              isCodeInComment(mergedLines, context.parserPath)
            ) {
              continue;
            }

            problematicBlocks.push({
              ...block,
              value: mergedLines,
            });
            break;
          }
        }
      }

      for (const fixableBlock of problematicBlocks) {
        context.report({
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
          message: `Comments may not exceed ${maxLength} characters`,
          fix: (fixer): Rule.Fix => {
            const newValue = fixCommentLength(fixableBlock, {
              maxLength,
              whitespaceSize,
            });

            // Now, in case the entire block is only a single line
            // (e.g. /** text... */), then we should expand it into a multi-line
            // comment to preserve space.
            if (lines.length === 1) {
              return fixer.replaceTextRange(
                commentRange,
                `${" ".repeat(whitespaceSize)}/**\n${newValue}\n${" ".repeat(
                  whitespaceSize
                )} */`
              );
            } else {
              // ... else we should simply replace the part of the comment which
              // overflows.
              const rawLines = comment.value.split("\n");
              const rangeStart =
                (comment.range?.[0] ?? 0) +
                MULTILINE_BOILERPLATE_SIZE +
                rawLines.slice(0, fixableBlock.startIndex).join("\n").length;
              const rangeEnd =
                (comment.range?.[0] ?? 0) +
                MULTILINE_BOILERPLATE_SIZE -
                1 +
                rawLines.slice(0, fixableBlock.endIndex + 1).join("\n").length;

              // ... but, in the rare case where the violating block starts on
              // the same line as the start of the multi-comment
              // (i.e. /** my-comment...), then move it down to the next line,
              // to maximize the available space.
              if (fixableBlock.startIndex === 0) {
                return fixer.replaceTextRange(
                  [rangeStart, rangeEnd],
                  `\n${" ".repeat(whitespaceSize)}${newValue}`
                );
              } else {
                return fixer.replaceTextRange([rangeStart, rangeEnd], newValue);
              }
            }
          },
        });
      }
    }

    return {};
  },
};

let ignoreLines = false;

/**
 * captures the next logical group/block in the provided multi-line comment
 * content, based on a set of rules.
 *
 * 1) Everything within a set of back-ticks (``) is ignored, as this is used
 * to explicitly declare that the content should not be auto-fixed.
 *
 * 2) Lines that are not on the same indentation-level will not be recognized
 * as part of the same block.
 *
 * 3) Lines separated by a new-line will not be considered as part of the same
 * block.
 *
 * 4) Lines will only be grouped in case the current line of the block to be
 * constructed actually is overflowing. This avoids issues where auto-fixing
 * 'sucks' a line up even though the previous line should have been considered a
 * logical end to a block.
 */
function captureNextBlock(
  lines: string[],
  initialStartIndex: number,
  args: {
    maxLength: number;
    whitespaceSize: number;
    boilerplateSize: number;
    ignoreUrls: boolean;
  }
): {
  lines: string[];
  lineOffsets: number[];
  startIndex: number;
  endIndex: number;
} {
  let startIndex = initialStartIndex;

  // the provided startIndex may not necessarily indicate the startIndex of the
  // next logical block. (it may e.g. just point to a blank line)
  // as such we need to determine the actual start of the next block.
  for (let i = initialStartIndex; i < lines.length; i++) {
    const line = lines[i];

    // ensure that lines within backticks is skipped (and that the line itself
    // is ignored as it acts as a marker).
    if (line?.startsWith("` ") || line?.startsWith("``")) {
      ignoreLines = !ignoreLines;
      continue;
    }

    startIndex = i;

    if (line && line.trim() !== "" && !ignoreLines) {
      break;
    }
  }

  const blockLines: string[] = lines.slice(startIndex, startIndex + 1);

  // In case we could not resolve the start of a new block, then we cannot
  // continue...
  if (blockLines.length === 0) {
    return {
      lines: blockLines,
      startIndex,
      endIndex: startIndex,
      lineOffsets: [],
    };
  }

  // ... else we can begin analysing the following lines to determine if they
  // are to be added to the current group
  for (let i = startIndex; i < lines.length; i++) {
    const currLine = lines[i];
    const nextLine = lines[i + 1];

    if (!currLine) {
      break;
    }

    if (
      !nextLine ||
      nextLine.trim() === "" ||
      (currLine.match(/^ */)?.[0]?.length ?? 0) !==
        (nextLine.match(/^ */)?.[0]?.length ?? 0) ||
      !isLineOverflowing(currLine + (nextLine.split(" ")[0] ?? ""), args)
    ) {
      return {
        lines: blockLines,
        startIndex,
        endIndex: i,
        lineOffsets: blockLines.map((it) => it.match(/^ */)?.[0]?.length ?? 0),
      };
    }

    blockLines.push(nextLine);
  }

  return {
    lines: blockLines,
    startIndex,
    endIndex: lines.length,
    lineOffsets: blockLines.map((it) => it.match(/^ */)?.[0]?.length ?? 0),
  };
}

function mergeLines(a: string, b: string, separator = " "): string {
  return `${a.trim()}${separator}${b.trim()}`;
}

/**
 * takes a fixable block and transform it into a singular string which
 * represents the fixed format of the block.
 */
function fixCommentLength(
  fixable: {
    value: string;
    lineOffsets: number[];
    startIndex: number;
    endIndex: number;
  },
  { maxLength, whitespaceSize }: { maxLength: number; whitespaceSize: number }
): string {
  const whitespace = " ".repeat(whitespaceSize);
  const lineStartSize =
    whitespaceSize + MULTILINE_BOILERPLATE_SIZE + (fixable.lineOffsets[0] ?? 0);
  const words = fixable.value.trim().split(" ");

  const newValue = words.reduce(
    (acc, curr) => {
      const lengthIfAdded = acc.currentLineLength + curr.length + 1; // + 1 to act as a final space, i.e. " "

      // We can safely split to a new line in case we are reaching and
      // overflowing line AND if there is at least one word on the current line.
      const splitToNewline =
        lengthIfAdded > maxLength && acc.currentLineLength !== lineStartSize;

      if (splitToNewline) {
        const nextLine = `${whitespace} *${" ".repeat(
          fixable.lineOffsets[
            Math.min(acc.currentLineIndex + 1, fixable.lineOffsets.length - 1)
          ] ?? 0
        )} ${curr}`;

        return {
          value: `${acc.value}\n${nextLine}`,
          currentLineLength: nextLine.length,
          currentLineIndex: acc.currentLineIndex + 1,
        };
      } else {
        return {
          value: `${acc.value} ${curr}`,
          currentLineLength: lengthIfAdded,
          currentLineIndex: acc.currentLineIndex,
        };
      }
    },
    {
      value: `${whitespace} *${" ".repeat(fixable.lineOffsets[0] ?? 0)}`,
      currentLineLength: lineStartSize,
      currentLineIndex: 0,
    }
  );

  return newValue.value;
}

function isLineOverflowing(
  line: string,
  {
    maxLength,
    whitespaceSize,
    boilerplateSize,
    ignoreUrls,
  }: {
    maxLength: number;
    whitespaceSize: number;
    boilerplateSize: number;
    ignoreUrls: boolean;
  }
): boolean {
  return (
    (!ignoreUrls || !isURL(line)) &&
    line.trim().split(" ").length > 1 &&
    line.length + whitespaceSize + boilerplateSize > maxLength
  );
}

function isSpecialComment(comment: Comment): boolean {
  return (
    comment.value.includes("eslint-disable") ||
    comment.value.includes("stylelint-disable") ||
    comment.value.includes("tslint:disable") ||
    comment.value.includes("eslint-enable") ||
    comment.value.includes("stylelint-enable") ||
    comment.value.includes("tslint:enable")
  );
}

function isCommentOnOwnLine(sourceCode: SourceCode, comment: Comment): boolean {
  const previousToken = sourceCode.getTokenBefore(comment);
  const nextToken = sourceCode.getTokenAfter(comment);

  return (
    previousToken?.loc.end.line !== comment.loc?.start.line &&
    nextToken?.loc.start.line !== comment.loc?.end.line
  );
}

function isCommentInComment(value: string): boolean {
  return value.includes("// ") || value.includes("/*") || value.includes("*/");
}

function isJSDocLikeComment(value: string): boolean {
  return value.startsWith("@");
}

function isCodeInComment(value: string, parserPath: string): boolean {
  const linter = new Linter();

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  linter.defineParser("parser", require(parserPath) as Linter.ParserModule);
  const output = linter.verify(value, { parser: "parser" });

  for (const msg of output) {
    if (msg.message.includes("Parsing error")) {
      return false;
    }
  }

  return true;
}

function getBoilerPlateSize(commentLines: string[]): number {
  return commentLines.length === 1
    ? SINGLE_LINE_BOILERPLATE_SIZE
    : MULTILINE_BOILERPLATE_SIZE;
}

function getCommentLines(comment: Comment): string[] {
  return comment.value.split("\n").map((it) => it.replace(/^ *?\* ?/, ""));
}
