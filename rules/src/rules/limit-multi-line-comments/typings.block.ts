/**
 * defines a singular logical block within a comment.
 */
export type MultilineBlock = {
  /**
   * includes the merged value of all comment lines within the block
   */
  value: string;

  /**
   * includes all textual content of all lines of this logical block
   */
  lines: string[];

  /**
   * specifies, for each line, how much whitespace there is to the left of the
   * comment, i.e. its offset to the left.
   */
  lineOffsets: number[];

  /**
   * specifies the index that the first line of this block has within the
   * entire comment that it is a part of.
   */
  startIndex: number;

  /**
   * specifies the index that the last line of this block has within the entire
   * comment that it is a part of.
   */
  endIndex: number;
};
