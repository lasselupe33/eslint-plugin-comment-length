import { TSESLint } from "@typescript-eslint/utils";

import { Context } from "../../typings.context";

import { MultilineBlock } from "./typings.block";
import { MULTILINE_BOILERPLATE_SIZE } from "./util.boilerplate-size";
import { formatBlock } from "./util.format-block";

export function fixOverflowingBlock(
  fixer: TSESLint.RuleFixer,
  fixableBlock: MultilineBlock,
  context: Context
) {
  const newValue = formatBlock(fixableBlock, context);

  // Now, in case the entire block is only a single line
  // (e.g. /** text... */), then we should expand it into a multi-line
  // comment to preserve space.
  if (context.comment.lines.length === 1) {
    return fixer.replaceTextRange(
      context.comment.range,
      `/**\n${newValue}\n${" ".repeat(context.whitespaceSize)} */`
    );
  } else {
    // ... else we should simply replace the part of the comment which
    // overflows.
    const rawLines = context.comment.value.split("\n");
    const rangeStart =
      context.comment.range[0] +
      MULTILINE_BOILERPLATE_SIZE +
      rawLines.slice(0, fixableBlock.startIndex).join("\n").length;
    const rangeEnd =
      context.comment.range[0] +
      MULTILINE_BOILERPLATE_SIZE -
      1 +
      rawLines.slice(0, fixableBlock.endIndex + 1).join("\n").length;

    // ... but, in the rare case where the violating block starts on
    // the same line as the start of the multi-comment
    // (i.e. /** my-comment...), then move it down to the next line,
    // to maximize the available space.
    if (fixableBlock.startIndex === 0) {
      return fixer.replaceTextRange(
        [rangeStart, rangeEnd],
        `\n${" ".repeat(context.whitespaceSize)}${newValue}`
      );
    } else {
      return fixer.replaceTextRange([rangeStart, rangeEnd], newValue);
    }
  }
}
