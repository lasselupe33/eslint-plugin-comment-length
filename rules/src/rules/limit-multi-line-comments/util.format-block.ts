import { Context } from "../../typings.context";
import { isAnotherWrapPointComing } from "../../utils/is-another-wrap-point-coming";
import { isPunctuation } from "../../utils/is-punctuation";

import { MultilineBlock } from "./typings.block";
import { MULTILINE_BOILERPLATE_SIZE } from "./util.boilerplate-size";

/**
 * takes a fixable block and transform it into a singular string which
 * represents the fixed format of the block.
 */
export function formatBlock(fixable: MultilineBlock, context: Context): string {
  const lineStartSize =
    context.whitespace.size +
    MULTILINE_BOILERPLATE_SIZE +
    (fixable.lineOffsets[0]?.size ?? 0);
  const words = fixable.value.trim().split(" ");

  const newValue = words.reduce(
    (acc, curr, index) => {
      const lengthIfAdded = acc.currentLineLength + curr.length + 1; // + 1 to act as a final space, i.e. " "

      // We can safely split to a new line in case we are reaching and
      // overflowing line AND if there is at least one word on the current line.
      const splitToNewline =
        lengthIfAdded > context.maxLength &&
        acc.currentLineLength !== lineStartSize;

      const previousWord = words[index - 1];
      const splitEarly =
        context.logicalWrap &&
        acc.currentLineLength >= context.maxLength / 2 &&
        previousWord &&
        previousWord.at(-1) &&
        isPunctuation(previousWord.at(-1)!) &&
        previousWord.length > 1 &&
        !isAnotherWrapPointComing(
          acc.currentLineLength,
          context.maxLength,
          words.slice(index)
        );
      if (splitToNewline || splitEarly) {
        const nextLine = `${context.whitespace.string} *${
          fixable.lineOffsets[
            Math.min(acc.currentLineIndex + 1, fixable.lineOffsets.length - 1)
          ]?.string ?? ""
        }${curr} `;

        return {
          value: `${acc.value.trimEnd()}\n${nextLine}`,
          currentLineLength: nextLine.length,
          currentLineIndex: acc.currentLineIndex + 1,
        };
      } else {
        return {
          value: `${acc.value}${curr} `,
          currentLineLength: lengthIfAdded,
          currentLineIndex: acc.currentLineIndex,
        };
      }
    },
    {
      value: `${context.whitespace.string} *${
        fixable.lineOffsets[0]?.string ?? ""
      }`,
      currentLineLength: lineStartSize,
      currentLineIndex: 0,
    }
  );

  return newValue.value.trimEnd();
}
