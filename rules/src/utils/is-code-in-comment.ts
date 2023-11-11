import { Linter } from "@typescript-eslint/utils/ts-eslint";

import { Context } from "../typings.context";

export function isCodeInComment(
  value: string | undefined,
  parserPath: string,
  context: Context,
): boolean {
  if (!value || !context.ignoreCommentsWithCode) {
    return false;
  }

  const linter = new Linter();

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  linter.defineParser("parser", require(parserPath) as Linter.ParserModule);
  const output = linter.verify(value, {
    parser: "parser",
    parserOptions: { ecmaVersion: "latest" },
    env: {
      node: true,
      es2023: true,
      browser: true,
    },
  });

  for (const msg of output) {
    if (msg.message.includes("Parsing error")) {
      return false;
    }
  }

  return true;
}
