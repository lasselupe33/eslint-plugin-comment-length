import { Context } from "../typings.context";

import { isURL } from "./is-url";

export function isLineOverflowing(line: string, context: Context): boolean {
  return (
    (!context.ignoreUrls || !isURL(line)) &&
    line.trim().split(" ").length > 1 &&
    line.length + context.whitespaceSize + context.boilerplateSize >
      context.maxLength
  );
}
