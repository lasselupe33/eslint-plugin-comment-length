import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

export type Options = {
  /**
   * specifies how the auto-fix wrapping mechanism functions.
   *
   * - "overflow-only" ensures that only overflowing lines are reflowed to new
   * lines,
   *
   * - whereas "compact" tries to produce as compact blocks as possible,
   * potentially merging multiple nearby lines even though no overflow was
   * occuring on the lines.
   *
   * - Finally, "compact-on-overflow" attempts to produce as compact blocks as
   * possible, however only when overflow within a block has been detected.
   *
   * @default overflow-only
   */
  mode: "overflow-only" | "compact-on-overflow" | "compact";

  /**
   * specifies the maxmium length that a comment is allowed to take
   *
   * @default 80
   */
  maxLength: number;

  /**
   * attempts to wrap at logical pauses in comments based on where punctuation
   * is found.
   *
   * This will often wrap the text sooner than if this was disabled,
   * but it potentially makes it easier to read comments.
   *
   * @default false
   */
  logicalWrap: boolean;

  /**
   * if set to true, then overflow lines including comments will be ignored
   *
   * @default true
   */
  ignoreUrls: boolean;

  /**
   * attempts to avoid reflowing comments that contains code as this may break
   * the semantic meaning of the code.
   *
   * NB: This option causes ESLint to be run on comment content in an attempt
   * to see if the code inside is parsable, which may have a significant
   * performance impact depending on the parser used.
   *
   * @default false
   */
  ignoreCommentsWithCode: boolean;

  /**
   * in case you are using tabs to indent your code, then this plugin needs to
   * know the configured tab size, in order to properly determine when a
   * comment exceeds the configured max length.
   *
   * If you are using VSCode, then this option should match the
   * `editor.tabSize` option.
   *
   * @default 2
   */
  tabSize: number;

  /**
   * by default semantic comments such as // eslint-disable* will be ignored by
   * this plugin as they may alter the functionality of other programs.
   *
   * In case you need to add additional variants of comments that should be
   * ignored by this plugin, then they can be added through this option.
   *
   * @example
   * semanticComments: ["i18n-extract-keys", "i18n-extract-mark-context"]
   */
  semanticComments?: string[];
};

export type RuleOptions = [Options];

export const defaultOptions = [
  {
    mode: "overflow-only",
    maxLength: 80,
    ignoreUrls: true,
    ignoreCommentsWithCode: false,
    tabSize: 2,
    logicalWrap: false,
    semanticComments: [],
  },
] satisfies RuleOptions;

export const optionsSchema = [
  {
    type: "object",
    properties: {
      mode: {
        type: "string",
        enum: ["overflow-only", "compact-on-overflow", "compact"],
      },
      maxLength: { type: "integer" },
      ignoreUrls: { type: "boolean" },
      ignoreCommentsWithCode: { type: "boolean" },
      tabSize: { type: "integer" },
      logicalWrap: { type: "boolean" },
      semanticComments: {
        type: "array",
        items: { type: "string" },
      },
    },
  },
] satisfies [JSONSchema4];
