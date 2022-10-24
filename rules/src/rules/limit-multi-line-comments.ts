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
        startIndex: number;
        endIndex: number;
      }> = [];

      // Processing multi-line comments becomes a tad more difficult than simply
      // parsing single-line comments since a single comment may contain
      // multiple logical comment blocks which should be handled individually.
      //
      // Thus our first step is to take a multi-line comment and convert it into
      // logical block
      for (let i = 0; i < lines.length; i++) {
        if (i < (blocks[blocks.length - 1]?.endIndex ?? 0)) {
          continue;
        }

        const block = captureBlock(lines, i);
        blocks.push(block);
      }

      const fixableBlocks: Array<{
        value: string;
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

            fixableBlocks.push({
              ...block,
              value: mergedLines,
            });
          }
        }
      }

      for (const fixableBlock of fixableBlocks) {
        context.report({
          loc: comment.loc,
          message: `Comments may not exceed ${maxLength} characters`,
          fix: (fixer): Rule.Fix => {
            const newValue = fixCommentLength(lines, fixableBlock, {
              maxLength,
              whitespaceSize,
            });

            return fixer.replaceTextRange(commentRange, newValue);
          },
        });
      }
    }

    return {};
  },
};

function captureBlock(
  lines: string[],
  initialStartIndex: number
): { lines: string[]; startIndex: number; endIndex: number } {
  let startIndex = initialStartIndex;

  for (let i = initialStartIndex; i < lines.length; i++) {
    const line = lines[i];

    if (line && line.trim() !== "") {
      startIndex = i;
      break;
    }
  }

  const relatedLines = lines.slice(startIndex, startIndex + 1);

  if (relatedLines.length === 0) {
    return { lines: relatedLines, startIndex, endIndex: startIndex + 1 };
  }

  for (let i = startIndex + 1; i < lines.length; i++) {
    const nextLine = lines[i];

    if (!nextLine || (nextLine.trim() === "" && !nextLine.startsWith(" "))) {
      return { lines: relatedLines, startIndex, endIndex: i };
    }

    relatedLines.push(nextLine);
  }

  return { lines: relatedLines, startIndex, endIndex: lines.length };
}

function mergeLines(a: string, b: string, separator = " "): string {
  return `${a.trim()}${separator}${b.trim()}`;
}

function fixCommentLength(
  lines: string[],
  fixable: { value: string; startIndex: number; endIndex: number },
  { maxLength, whitespaceSize }: { maxLength: number; whitespaceSize: number }
): string {
  const whitespace = " ".repeat(whitespaceSize);
  const startValues = lines.slice(0, fixable.startIndex);
  const endValues = lines.slice(fixable.endIndex);

  const lineStartSize = whitespaceSize + MULTILINE_BOILERPLATE_SIZE;
  const fixableWords = fixable.value.trim().split(" ");

  let newValue = `/** `;

  if (startValues.length > 0) {
    newValue += startValues.join(`\n${whitespace} * `);
  }

  const fixedContent = fixableWords.reduce(
    (acc, curr) => {
      const lengthIfAdded = acc.currentLineLength + curr.length + 1;
      // We can safely split to a new line in case we are reaching and
      // overflowing line AND if there is at least one word on the current line.
      const splitToNewline =
        lengthIfAdded > maxLength && acc.currentLineLength !== lineStartSize;

      if (splitToNewline) {
        return {
          value: `${acc.value}\n${whitespace} * ${curr}`,
          currentLineLength: lineStartSize,
        };
      } else {
        return {
          value: `${acc.value} ${curr}`,
          currentLineLength: lengthIfAdded,
        };
      }
    },
    { value: "", currentLineLength: lineStartSize }
  );

  newValue += `\n${whitespace} *${fixedContent.value}`;

  if (endValues.length > 0) {
    newValue += `\n${whitespace} * ${endValues.join(`\n${whitespace} * `)}`;
  }

  if (endValues[endValues.length - 1] === "") {
    newValue = `${newValue.slice(0, -1)}/`;
  } else {
    newValue += `\n${whitespace} */`;
  }

  return newValue;
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
  return comment.value
    .replace(/ *\*/g, "")
    .split("\n")
    .map((it) => it.replace(/^ /, ""));
}
