import type { TSESTree } from "@typescript-eslint/utils";

import type { Options } from "./typings.options";

export type Context = Options & {
  /**
   * specifies the amount and format of whitespace a particular comment has to
   * the left of it.
   */
  whitespace: {
    string: string;
    size: number;
  };

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
