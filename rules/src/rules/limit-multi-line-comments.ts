import type { Rule } from "eslint";

export const limitMultiLineCommentsRule: Rule.RuleModule = {
  meta: {
    type: "layout",
    fixable: "whitespace",
  },
  create: (context: Rule.RuleContext): Rule.RuleListener => {
    const comments = context.getSourceCode().getAllComments();

    for (const comment of comments) {
      const commentRange = comment.range;
      const whitespaceSize = comment.loc?.start.column ?? 0;
      const whiteSpace = " ".repeat(whitespaceSize);

      if (comment.loc && commentRange && comment.type === "Block") {
        const rawLines = comment.value.split("\n");
        const lines = rawLines.map((line) => line.replace(/\*/g, "").trim());

        let hasContentOnFirstLine = true;

        // Strip the first line of the multiline-comment if it does not contain
        // any content.. We do not want to trigger additional unwanted
        // line-breaks since start and end tag will be appended manually later
        // on.
        if (lines[0] === "") {
          hasContentOnFirstLine = false;
          lines.splice(0, 1);
        }

        // ... strip end line if it does not contain content as well.
        if (lines[lines.length - 1] === "") {
          lines.splice(-1, 1);
        }

        const isSingleLine = rawLines.length === 1;
        const commentBoilerplateSize = isSingleLine
          ? whitespaceSize + 4 // +4 for "/*" and "*/"
          : hasContentOnFirstLine
          ? whitespaceSize + 2 // +2 for "/*", but not "*/" since there is more than one line
          : 0;

        if (
          rawLines.find((line) => line.length + commentBoilerplateSize > 80)
        ) {
          context.report({
            loc: comment.loc,
            message: "Comments may not exceed 80 characters",
            fix: (fixer) => {
              const newCommentLines = lines?.reduce<string[]>(
                (acc, currentLine) => {
                  // Respect empty lines.
                  if (currentLine === "") {
                    acc.push(`${whiteSpace} *\n${whiteSpace} *`);

                    return acc;
                  }

                  const wordsInCurrentLine = currentLine.trim().split(" ");

                  for (const word of wordsInCurrentLine) {
                    const newLine = acc[acc.length - 1];

                    // In case we are not in the process of constructing a new
                    // line, or if it would exceed the target chars, then
                    // create a new line!
                    if (!newLine || newLine?.length + word.length + 1 > 80) {
                      acc.push(`${whiteSpace} * ${word}`);
                    } else {
                      acc[acc.length - 1] = `${newLine} ${word}`;
                    }
                  }

                  return acc;
                },
                []
              );

              const newComment = `/**\n${newCommentLines.join(
                "\n"
              )}\n${whiteSpace} */`;

              return fixer.replaceTextRange(commentRange, newComment);
            },
          });
        }
      }
    }

    return {};
  },
};
