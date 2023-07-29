const punctuation = [",", ".", "?", ":", "!", ";"];

export function isPunctuation(char: string | undefined): boolean {
  return !!char && punctuation.includes(char);
}
