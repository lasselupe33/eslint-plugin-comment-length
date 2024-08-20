import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import type { Context } from "../../typings.context";

import { formatBlock } from "./util.format-block";

export function fixOverflow(
  fixer: TSESLint.RuleFixer,
  fixableComment: TSESTree.LineComment,
  context: Context,
) {
  const newValue = formatBlock(fixableComment, context);

  return fixer.replaceTextRange(context.comment.range, newValue);
}
