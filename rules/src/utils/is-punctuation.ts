const punctuation = [",", ".", "?", ":", "!", ";"];

export function isPunctuation(char: string): boolean {
  return punctuation.includes(char);
}
