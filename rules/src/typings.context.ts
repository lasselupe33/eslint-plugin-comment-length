import { TSESTree } from "@typescript-eslint/utils";

export type Context = {
  /**
   * specifies the maxmium length that a comment is allowed to take
   */
  maxLength: number;

  /**
   * if set to true, then overflow lines including comments will be ignored
   */
  ignoreUrls: boolean;

  /**
   * specifies the amount of whitespace a particular comment has to the left of
   * it.
   */
  whitespaceSize: number;

  /**
   * specifies the amount if characters that a particular comment boilerplate
   * takes (e.g. '// '.length --> 3)
   */
  boilerplateSize: number;

  /**
   * contains context related to the currently analyzed comment
   */
  comment: {
    value: string;
    lines: string[];
    range: TSESTree.Range;
  };
};
