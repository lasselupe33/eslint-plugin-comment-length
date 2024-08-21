import { Linter } from "@typescript-eslint/utils/ts-eslint";

import { type Context } from "../typings.context.js";

export function isCodeInComment(
  value: string | undefined,
  context: Context,
): boolean {
  if (!value || !context.ignoreCommentsWithCode) {
    return false;
  }

  const linter = new Linter({ configType: "flat" });

  const output = linter.verify(value, [
    {
      languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  ]);

  for (const msg of output) {
    if (msg.message.includes("Parsing error")) {
      return false;
    }
  }

  return true;
}
