export function isCommentInComment(value: string): boolean {
  return value.includes("// ") || value.includes("/*") || value.includes("*/");
}
