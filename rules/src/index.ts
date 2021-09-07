import { limitMultiLineCommentsRule } from "./rules/limit-multi-line-comments";
import { limitSingleLineCommentsRule } from "./rules/limit-single-line-comments";

export const rules = {
  "limit-single-line-comments": limitSingleLineCommentsRule,
  "limit-multi-line-comments": limitMultiLineCommentsRule,
};
