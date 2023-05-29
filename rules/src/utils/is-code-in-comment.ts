import { Linter } from "@typescript-eslint/utils/dist/ts-eslint";

export function isCodeInComment(
  value: string | undefined,
  parserPath: string
): boolean {
  if (!value) {
    return false;
  }

  const linter = new Linter();

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  linter.defineParser("parser", require(parserPath) as Linter.ParserModule);
  const output = linter.verify(value, { parser: "parser" });

  for (const msg of output) {
    if (msg.message.includes("Parsing error")) {
      return false;
    }
  }

  return true;
}
