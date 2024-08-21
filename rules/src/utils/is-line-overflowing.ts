import { type Context } from "../typings.context.js";

import { isURL } from "./is-url.js";

export function isLineOverflowing(line: string, context: Context): boolean {
  return (
    (!context.ignoreUrls || !isURL(line)) &&
    line.trim().split(" ").length > 1 &&
    line.length + context.whitespace.size + context.boilerplateSize >
      context.maxLength
  );
}
