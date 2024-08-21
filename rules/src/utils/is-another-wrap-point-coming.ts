import { isPunctuation } from "./is-punctuation.js";

export function isAnotherWrapPointComing(
  currentLength: number,
  maxLength: number,
  wordsToCome: string[],
): boolean {
  for (const word of wordsToCome) {
    if (isPunctuation(word.at(-1)) && word.length > 1) {
      return true;
    }
    currentLength += word.length + 1;
    if (currentLength >= maxLength) {
      return false;
    }
  }
  return false;
}
