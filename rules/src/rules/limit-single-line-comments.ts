import type { Rule, SourceCode } from "eslint";
import { Comment } from "estree";

const COMMENT_BOILERPLATE_SIZE = 2; // i.e. '//'.length

export const limitSingleLineCommentsRule: Rule.RuleModule = {
  meta: {
    type: "layout",
    fixable: "whitespace",
  },
  create: (context: Rule.RuleContext): Rule.RuleListener => {
    const maxLength = (context.options[0] as number) ?? 80;

    const sourceCode = context.getSourceCode();
    const comments = sourceCode.getAllComments();

    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];
      const whitespaceSize = comment?.loc?.start.column ?? 0;

      if (
        comment &&
        comment.loc &&
        comment.type === "Line" &&
        isCommentOverflowing(comment.value, { maxLength, whitespaceSize }) &&
        !isSpecialComment(comment) &&
        isCommentOnOwnLine(sourceCode, comment)
      ) {
        const fixableComment = captureRelevantComments(
          sourceCode,
          comments,
          i,
          { whitespaceSize, maxLength }
        );

        if (!fixableComment || isCommentInComment(fixableComment)) {
          return {};
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
  { maxLength, whitespaceSize }: { maxLength: number; whitespaceSize: number }
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
        }
      )
    ) {
      break;
    }
  }

  return comment;
}

function mergeComments(a: Comment, b: Comment): Comment {
  const newComment = { ...a };

  newComment.value = `${a.value.trim()} ${b.value.trim()}`;

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
  { maxLength, whitespaceSize }: { maxLength: number; whitespaceSize: number }
): boolean {
  return (
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
