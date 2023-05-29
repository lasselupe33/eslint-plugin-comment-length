import { Context } from "./typings.context";

export type RuleOptions = [
  Pick<Context, "maxLength" | "ignoreUrls" | "ignoreCommentsWithCode">
];

export const defaultOptions = [
  { maxLength: 80, ignoreUrls: true, ignoreCommentsWithCode: true },
] satisfies RuleOptions;

export const optionsSchema = [
  {
    type: "object",
    properties: {
      maxLength: { type: "integer" },
      ignoreUrls: { type: "boolean" },
      ignoreCommentsWithCode: { type: "boolean" },
    },
  },
];
