import { TSESTree } from "@typescript-eslint/utils";

import { Context } from "../../typings.context";
import { isURL } from "../../utils/is-url";

import { SINGLE_LINE_COMMENT_BOILERPLATE_SIZE } from "./const.boilerplate-size";

export function formatBlock(
  block: TSESTree.LineComment,
  context: Context
): string {
  const lineStartSize =
    context.whitespace.size + SINGLE_LINE_COMMENT_BOILERPLATE_SIZE;
  const words = block.value.trim().split(" ");

  const newValue = words.reduce(
    (acc, curr) => {
      const currentWordIsURL = isURL(curr);

      const lengthIfAdded = acc.currentLineLength + curr.length + 1;
      // We can safely split to a new line in case we are reaching and
      // overflowing line AND if there is at least one word on the current line.
      const splitToNewline =
        lengthIfAdded >= context.maxLength &&
        acc.currentLineLength !== lineStartSize &&
        (!context.ignoreUrls || !currentWordIsURL);

      if (splitToNewline) {
        return {
          value: `${acc.value}\n${context.whitespace.string}// ${curr}`,
          currentLineLength: lineStartSize + curr.length,
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
