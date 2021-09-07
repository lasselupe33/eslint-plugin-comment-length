import type { Rule } from "eslint";
import { Comment } from "estree";

type GroupedComments = {
  relatedComments: Set<Comment>;
  groupedComment: Comment;
};

export const limitSingleLineCommentsRule: Rule.RuleModule = {
  meta: {
    type: "layout",
    fixable: "whitespace",
  },
  create: (context: Rule.RuleContext): Rule.RuleListener => {
    const sourceCode = context.getSourceCode();
    const comments = sourceCode.getAllComments();

    // Firstly we parse all individual single-line comments into logical chunks,
    // wherein a group is to be considered all comments that occur directly
    // after
    // each other.
    const groupedComments = comments.reduce<GroupedComments[]>(
      (acc, rawCurr) => {
        const curr = { ...rawCurr };

        // Skip irrelevant blocks
        if (curr.type !== "Line") {
          return acc;
        }

        const newestChunk = acc[acc.length - 1];
        const newestGroup = newestChunk?.groupedComment;

        // In case the current line comment directly follows the group that we
        // are currently generating, then append the comment to the group that
        // we're generating.
        if (newestGroup?.loc?.end?.line === (curr.loc?.start?.line ?? 0) - 1) {
          if (newestGroup.loc.end && curr.loc?.end) {
            newestGroup.loc.end = curr.loc.end;
          }

          if (newestGroup.range && curr.range) {
            newestGroup.range[1] = curr.range[1];
          }

          newestGroup.value += curr.value;
          newestChunk?.relatedComments.add(rawCurr);
        } else {
          // ... else we will begin generating a new group
          acc.push({
            relatedComments: new Set([rawCurr]),
            groupedComment: curr,
          });
        }

        return acc;
      },
      []
    );

    for (const comment of comments) {
      const whitespaceSize = comment.loc?.start.column ?? 0;
      const nodeBefore = sourceCode.getTokenBefore(comment);

      if (
        (!nodeBefore || nodeBefore.type === "Punctuator") &&
        comment.loc &&
        comment.type === "Line" &&
        comment.value.length + whitespaceSize + 2 > 80
      ) {
        const commentGroup = groupedComments.find((group) =>
          group.relatedComments.has(comment)
        );

        const groupRange = commentGroup?.groupedComment.range;

        // In case the commmentGroup was parsed incorrectly, then this issue
        // cannot be fixed, and hence we will not bother reporting it either.
        if (!groupRange) {
          continue;
        }

        context.report({
          loc: comment.loc,
          message: "Comments may not exceed 80 characters",
          fix: (fixer): Rule.Fix => {
            const commentWords = commentGroup?.groupedComment.value
              .replace(/\n/g, "")
              .trim()
              .split(" ");

            const newCommentLines = commentWords?.reduce<string[]>(
              (acc, curr) => {
                const currLine = acc[acc.length - 1];

                if (
                  !currLine ||
                  currLine.length + curr.length + whitespaceSize + 1 > 80
                ) {
                  acc.push(`// ${curr}`);
                } else {
                  acc[acc.length - 1] = `${currLine} ${curr}`;
                }

                return acc;
              },
              []
            );

            return fixer.replaceTextRange(
              groupRange,
              newCommentLines?.join("\n") ??
                commentGroup?.groupedComment.value ??
                "// <error />"
            );
          },
        });
      }
    }

    return {};
  },
};
