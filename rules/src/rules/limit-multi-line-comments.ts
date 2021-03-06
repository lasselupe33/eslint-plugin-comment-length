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

      let hasConflictingLine = false;
      const fixableLinesBlocks: Array<{
        value: string;
        startIndex: number;
        endIndex: number;
      }> = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (
          line &&
          isLineOverflowing(line, {
            maxLength,
            whitespaceSize,
            boilerplateSize: getBoilerPlateSize(lines),
            ignoreUrls,
          })
        ) {
          const fixableLines = captureRelevantLines(lines, i, {
            whitespaceSize,
            maxLength,
            ignoreUrls,
          });

          fixableLinesBlocks.push(fixableLines);

          if (
            isCommentInComment(fixableLines.value) ||
            isCodeInComment(captureNearbyLines(lines, i), context.parserPath)
          ) {
            hasConflictingLine = true;
            continue;
          }
        }
      }

      if (hasConflictingLine) {
        return {};
      }

      for (const fixableLines of fixableLinesBlocks) {
        context.report({
          loc: comment.loc,
          message: `Comments may not exceed ${maxLength} characters`,
          fix: (fixer): Rule.Fix => {
            const newValue = fixCommentLength(lines, fixableLines, {
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

function captureRelevantLines(
  lines: string[],
  startIndex: number,
  {
    maxLength,
    whitespaceSize,
    ignoreUrls,
  }: { maxLength: number; whitespaceSize: number; ignoreUrls: boolean }
): { value: string; startIndex: number; endIndex: number } {
  let line = lines[startIndex];

  if (!line) {
    return { value: "", startIndex, endIndex: startIndex + 1 };
  }

  for (let i = startIndex + 1; i < lines.length; i++) {
    const nextLine = lines[i];

    if (!nextLine || nextLine.trim() === "") {
      return { value: line, startIndex, endIndex: i };
    }

    line = mergeLines(line, nextLine);

    if (
      !isLineOverflowing(nextLine + lines[i + 1]?.trim().split(" ")[0], {
        maxLength,
        whitespaceSize,
        boilerplateSize: SINGLE_LINE_BOILERPLATE_SIZE,
        ignoreUrls,
      })
    ) {
      return { value: line, startIndex, endIndex: i + 1 };
    }
  }

  return { value: line, startIndex, endIndex: lines.length };
}

function captureNearbyLines(lines: string[], startIndex: number): string {
  let line = lines[startIndex];

  if (!line) {
    return "";
  }

  for (let i = startIndex - 1; i >= 0; i--) {
    const prevLine = lines[i];

    if (!prevLine || prevLine.trim() === "") {
      break;
    }

    line = mergeLines(prevLine, line, "\n");
  }

  for (let i = startIndex + 1; i < lines.length; i++) {
    const nextLine = lines[i];

    if (!nextLine || nextLine.trim() === "") {
      break;
    }

    line = mergeLines(line, nextLine, "\n");
  }

  return line;
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
  if (value.includes("// ") || value.includes("/*") || value.includes("*/")) {
    return true;
  }

  return false;
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
    .replace(/\*/g, "")
    .split("\n")
    .map((line) => line.trim());
}
