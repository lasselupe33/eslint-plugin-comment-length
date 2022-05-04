// eslint-disable-next-line import/no-extraneous-dependencies
import { Linter, Rule, SourceCode } from "eslint";
import { Comment } from "estree";

import { Options } from "../classes/Options";
import { deepCloneValue } from "../utils/immutableDeepMerge";
import { isURL } from "../utils/utils";

const COMMENT_BOILERPLATE_SIZE = 2; // i.e. '//'.length

export const limitSingleLineCommentsRule: Rule.RuleModule = {
  meta: {
    type: "layout",
    fixable: "whitespace",
  },
  create: (context: Rule.RuleContext): Rule.RuleListener => {
    // The options object must be the last option specified
    const specifiedOptions = context.options.at(-1);
    const options = new Options(specifiedOptions);
    const { maxLength, ignoreUrls } = options;

    const sourceCode = context.getSourceCode();
    const comments = sourceCode.getAllComments();

    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];
      const whitespaceSize = comment?.loc?.start.column ?? 0;

      if (
        comment &&
        comment.loc &&
        comment.type === "Line" &&
        isCommentOverflowing(comment.value, {
          maxLength,
          whitespaceSize,
          ignoreUrls,
        }) &&
        !isSpecialComment(comment) &&
        isCommentOnOwnLine(sourceCode, comment)
      ) {
        const fixableComment = captureRelevantComments(
          sourceCode,
          comments,
          i,
          { whitespaceSize, maxLength, ignoreUrls }
        );

        if (
          !fixableComment ||
          isCommentInComment(fixableComment) ||
          isCodeInComment(
            captureNearbyComments(comments, i),
            context.parserPath
          )
        ) {
          continue;
        }

        context.report({
          loc: comment.loc,
          message: `Comments may not exceed ${maxLength} characters`,
          fix: (fixer): Rule.Fix => {
            if (!fixableComment?.range) {
              throw new Error(
                "<eslint-plugin-comment-length/limit-single-line-comments>: unable to fix incompatible comment"
              );
            }

            const newValue = fixCommentLength(fixableComment, {
              maxLength,
              whitespaceSize,
            });

            return fixer.replaceTextRange(fixableComment.range, newValue);
          },
        });
      }
    }

    return {};
  },
};

function captureRelevantComments(
  sourceCode: SourceCode,
  comments: Comment[],
  startIndex: number,
  {
    maxLength,
    whitespaceSize,
    ignoreUrls,
  }: { maxLength: number; whitespaceSize: number; ignoreUrls: boolean }
): Comment | undefined {
  let comment = comments[startIndex];

  if (!comment) {
    return;
  }

  for (let i = startIndex + 1; i < comments.length; i++) {
    const nextComment = comments[i];

    if (
      !nextComment ||
      nextComment.value.trim() === "" ||
      nextComment.loc?.start.line !== (comment.loc?.end.line ?? 0) + 1 ||
      isSpecialComment(nextComment) ||
      !isCommentOnOwnLine(sourceCode, nextComment)
    ) {
      break;
    }

    comment = mergeComments(comment, nextComment);

    if (
      !isCommentOverflowing(
        nextComment.value + (comments[i + 1]?.value.trim().split(" ")[0] ?? ""),
        {
          maxLength,
          whitespaceSize,
          ignoreUrls,
        }
      )
    ) {
      break;
    }
  }

  return comment;
}

function captureNearbyComments(
  comments: Comment[],
  startIndex: number
): Comment | undefined {
  let comment = comments[startIndex];

  if (!comment) {
    return;
  }

  // Previous comments
  for (let i = startIndex - 1; i >= 0; i--) {
    const prevComment = comments[i];

    if (
      !prevComment ||
      (prevComment.loc?.end.line ?? 0) + 1 !== comment.loc?.start.line
    ) {
      break;
    }

    comment = mergeComments(prevComment, comment, "\n");
  }

  // Following comments
  for (let i = startIndex + 1; i < comments.length; i++) {
    const nextComment = comments[i];

    if (
      !nextComment ||
      nextComment.loc?.start.line !== (comment.loc?.end.line ?? 0) + 1
    ) {
      break;
    }

    comment = mergeComments(comment, nextComment, "\n");
  }

  return comment;
}

function mergeComments(a: Comment, b: Comment, separator = " "): Comment {
  const newComment = deepCloneValue(a);

  newComment.value = `${a.value.trim()}${separator}${b.value.trim()}`;

  if (newComment.loc && b.loc) {
    newComment.loc.end = b.loc.end;
  }

  if (newComment.range && b.range) {
    newComment.range[1] = b.range[1];
  }

  return newComment;
}

function fixCommentLength(
  comment: Comment,
  { maxLength, whitespaceSize }: { maxLength: number; whitespaceSize: number }
): string {
  const whitespace = " ".repeat(whitespaceSize);
  const lineStartSize = whitespaceSize + COMMENT_BOILERPLATE_SIZE;
  const words = comment.value.trim().split(" ");

  const newValue = words.reduce(
    (acc, curr) => {
      const lengthIfAdded = acc.currentLineLength + curr.length + 1;
      // We can safely split to a new line in case we are reaching and
      // overflowing line AND if there is at least one word on the current line.
      const splitToNewline =
        lengthIfAdded > maxLength && acc.currentLineLength !== lineStartSize;

      if (splitToNewline) {
        return {
          value: `${acc.value}\n${whitespace}// ${curr}`,
          currentLineLength: lineStartSize,
        };
      } else {
        return {
          value: `${acc.value} ${curr}`,
          currentLineLength: lengthIfAdded,
        };
      }
    },
    { value: "//", currentLineLength: lineStartSize }
  );

  return newValue.value;
}

function isCommentOnOwnLine(sourceCode: SourceCode, comment: Comment): boolean {
  const previousToken = sourceCode.getTokenBefore(comment);

  return previousToken?.loc.end.line !== comment.loc?.start.line;
}

function isCommentOverflowing(
  value: string,
  {
    maxLength,
    whitespaceSize,
    ignoreUrls,
  }: { maxLength: number; whitespaceSize: number; ignoreUrls: boolean }
): boolean {
  return (
    (!ignoreUrls || !isURL(value)) &&
    value.trim().split(" ").length > 1 &&
    value.length + whitespaceSize + COMMENT_BOILERPLATE_SIZE > maxLength
  );
}

function isCommentInComment(comment: Comment): boolean {
  if (
    comment.value.includes("// ") ||
    comment.value.includes("/*") ||
    comment.value.includes("*/")
  ) {
    return true;
  }

  return false;
}

function isSpecialComment(comment: Comment): boolean {
  return (
    comment.value.trim().startsWith("eslint-disable") ||
    comment.value.trim().startsWith("stylelint-disable") ||
    comment.value.trim().startsWith("tslint:disable") ||
    comment.value.trim().startsWith("eslint-enable") ||
    comment.value.trim().startsWith("stylelint-enable") ||
    comment.value.trim().startsWith("tslint:enable")
  );
}

function isCodeInComment(
  comment: Comment | undefined,
  parserPath: string
): boolean {
  if (!comment) {
    return false;
  }

  const linter = new Linter();

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  linter.defineParser("parser", require(parserPath) as Linter.ParserModule);
  const output = linter.verify(comment.value, { parser: "parser" });

  for (const msg of output) {
    if (msg.message.includes("Parsing error")) {
      return false;
    }
  }

  return true;
}
