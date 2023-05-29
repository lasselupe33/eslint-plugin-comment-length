export function isJSDocLikeComment(value: string): boolean {
  return value.startsWith("@");
}
