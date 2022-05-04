/**
 * Copied from ESLint:
 * https://github.com/eslint/eslint/blob/main/lib/rules/max-len.js
 */
const URL_REGEXP = /[^:/?#]:\/\/[^?#]/u;

export function isURL(str: string): boolean {
  return URL_REGEXP.test(str);
}
