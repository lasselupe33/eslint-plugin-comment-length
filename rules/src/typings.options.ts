import type { JSONSchema4 } from "@typescript-eslint/utils/dist/json-schema";

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
   * to see if the code inside is parsable.
   *
   * @default true
   */
  ignoreCommentsWithCode: boolean;
};

export type RuleOptions = [Options];

export const defaultOptions = [
  {
    mode: "overflow-only",
    maxLength: 80,
    ignoreUrls: true,
    ignoreCommentsWithCode: true,
  },
] satisfies RuleOptions;

export const optionsSchema = [
  {
    type: "object",
    properties: {
      mode: {
        enum: ["overflow-only", "compact-on-overflow", "compact"],
      },
      maxLength: { type: "integer" },
      ignoreUrls: { type: "boolean" },
      ignoreCommentsWithCode: { type: "boolean" },
    },
  },
] as [JSONSchema4];
