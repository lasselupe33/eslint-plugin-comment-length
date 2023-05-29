import { TSESTree } from "@typescript-eslint/utils";

import { Context } from "../../typings.context";

import { SINGLE_LINE_COMMENT_BOILERPLATE_SIZE } from "./const.boilerplate-size";

export function formatBlock(
  block: TSESTree.LineComment,
  context: Context
): string {
  const whitespace = " ".repeat(context.whitespaceSize);
  const lineStartSize =
    context.whitespaceSize + SINGLE_LINE_COMMENT_BOILERPLATE_SIZE;
  const words = block.value.trim().split(" ");

  const newValue = words.reduce(
    (acc, curr) => {
      const lengthIfAdded = acc.currentLineLength + curr.length + 1;
      // We can safely split to a new line in case we are reaching and
      // overflowing line AND if there is at least one word on the current line.
      const splitToNewline =
        lengthIfAdded > context.maxLength &&
        acc.currentLineLength !== lineStartSize;

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
