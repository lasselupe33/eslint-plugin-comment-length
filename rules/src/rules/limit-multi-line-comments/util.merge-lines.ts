export function mergeLines(a: string, b: string, separator = " "): string {
  return `${a.trim()}${separator}${b.trim()}`;
}
