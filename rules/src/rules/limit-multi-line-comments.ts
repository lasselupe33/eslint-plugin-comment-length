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

      if (comment.loc && commentRange && comment.type === "Block") {
        const individualLines = comment.value.split("\n");

        for (const line of individualLines) {
          if (line.length > 80) {
            context.report({
              loc: comment.loc,
              message: "Comments may not exceed 80 characters",
              fix: (fixer) => {
                const commentWords = individualLines
                  .map((line) => line.replace(/\*/g, "").trim())
                  .slice(1, -1);

                console.log(commentWords);

                const newCommentLines = commentWords?.reduce<string[]>(
                  (acc, oldLine) => {
                    if (oldLine === "") {
                      acc.push(" *\n *");

                      return acc;
                    }

                    const currWords = oldLine.trim().split(" ");

                    for (const word of currWords) {
                      const currLine = acc[acc.length - 1];

                      if (
                        !currLine ||
                        currLine?.length + word.length + 1 > 80
                      ) {
                        acc.push(` * ${word}`);
                      } else {
                        acc[acc.length - 1] = `${currLine} ${word}`;
                      }
                    }

                    return acc;
                  },
                  []
                );

                const newComment = `/**\n${newCommentLines.join("\n")}\n */`;

                return fixer.replaceTextRange(commentRange, newComment);
              },
            });
          }
        }
      }
    }

    return {};
  },
};
