import {
  AST_TOKEN_TYPES,
  TSESTree,
  ESLintUtils,
} from "@typescript-eslint/utils";
import { isIdentifier } from "@typescript-eslint/utils/ast-utils";

import { MessageIds, reportMessages } from "../../const.message-ids";
import {
  RuleOptions,
  defaultOptions,
  optionsSchema,
} from "../../typings.options";
import { resolveDocsRoute } from "../../utils/resolve-docs-route";
import { limitMultiLineComments } from "../limit-multi-line-comments/root";
import { limitSingleLineComments } from "../limit-single-line-comments/root";

const createRule = ESLintUtils.RuleCreator(resolveDocsRoute);

export const limitTaggedTemplateLiteralCommentsRule = createRule<
  [RuleOptions[0] & { tags: string[] }],
  MessageIds
>({
  name: "limit-tagged-template-literal-comments",
  defaultOptions: [{ ...defaultOptions[0], tags: ["css"] }],
  meta: {
    type: "layout",
    fixable: "whitespace",
    messages: reportMessages,
    docs: {
      description:
        "Reflows javascript comments within tagged template literals to ensure that blocks never exceed the configured length",
      recommended: "stylistic",
    },
    schema: [
      {
        ...optionsSchema,
        type: "object",
        properties: {
          ...optionsSchema[0].properties,
          tags: { type: "array", items: { type: "string" } },
        },
      },
    ],
  },

  create: (ruleContext, [options]) => {
    return {
      TaggedTemplateExpression: (node) => {
        if (!isIdentifier(node.tag) || !options.tags.includes(node.tag.name)) {
          return;
        }

        const blockComments = [] as TSESTree.BlockComment[];
        const lineComments = [] as TSESTree.LineComment[];

        for (const quasi of node.quasi.quasis) {
          let column = quasi.loc.start.column;
          let line = quasi.loc.start.line;
          let rangeIndex = quasi.range[0];

          let currentBlockComment: undefined | TSESTree.BlockComment;
          let currentLineComment: undefined | TSESTree.LineComment;

          for (let cursor = 0; cursor < quasi.value.cooked.length; cursor++) {
            const currentChar = quasi.value.cooked[cursor];
            const nextChar = quasi.value.cooked[cursor + 1];

            rangeIndex++;

            if (currentChar === "/" && nextChar === "*") {
              currentBlockComment = {
                type: AST_TOKEN_TYPES.Block,
                value: "",
                loc: {
                  start: {
                    column,
                    line,
                  },
                  end: {
                    column: 0,
                    line: 0,
                  },
                },
                range: [rangeIndex, 0],
              };

              // Skip the next char which is also part of the start of our
              // comment.
              cursor++;
              column += 2;
              rangeIndex++;
              continue;
            }

            if (
              currentChar === "*" &&
              nextChar === "/" &&
              currentBlockComment
            ) {
              cursor++;
              column += 2;
              rangeIndex++;

              currentBlockComment.loc.end.line = line;
              currentBlockComment.loc.end.column = column;
              currentBlockComment.range[1] = rangeIndex + 1;

              blockComments.push(currentBlockComment);
              currentBlockComment = undefined;

              continue;
            }

            if (
              currentChar === "/" &&
              nextChar === "/" &&
              quasi.value.cooked[cursor + 2] === " "
            ) {
              currentLineComment = {
                type: AST_TOKEN_TYPES.Line,
                value: "",
                loc: {
                  start: {
                    column,
                    line,
                  },
                  end: {
                    column: 0,
                    line: 0,
                  },
                },
                range: [rangeIndex, 0],
              };

              cursor++;
              column += 2;
              rangeIndex++;
              continue;
            }

            if (currentBlockComment) {
              currentBlockComment.value += currentChar;
            }

            if (currentLineComment) {
              currentLineComment.value += currentChar;
            }

            if (currentChar === "\n") {
              if (currentLineComment) {
                currentLineComment.loc.end.line = line;
                currentLineComment.loc.end.column = column;
                currentLineComment.range[1] = rangeIndex;

                lineComments.push(currentLineComment);

                currentLineComment = undefined;
              }

              line++;
              column = 0;
            } else {
              column++;
            }
          }
        }

        limitSingleLineComments(ruleContext, options, lineComments);
        limitMultiLineComments(ruleContext, options, blockComments);
      },
    };
  },
});
