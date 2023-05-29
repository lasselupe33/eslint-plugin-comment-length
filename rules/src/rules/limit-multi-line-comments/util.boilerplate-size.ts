export const SINGLE_LINE_BOILERPLATE_SIZE = 6; // i.e. '/*'.length + '*/'.length
export const MULTILINE_BOILERPLATE_SIZE = 3; // i.e. '/*'.length OR '*/'.length OR ' *'.length

export function getBoilerPlateSize(commentLines: string[]): number {
  return commentLines.length === 1
    ? SINGLE_LINE_BOILERPLATE_SIZE
    : MULTILINE_BOILERPLATE_SIZE;
}
