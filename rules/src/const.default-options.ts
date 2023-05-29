import { RuleOptions } from "./typings.options";

export const defaultOptions = [
  { maxLength: 80, ignoreUrls: true },
] satisfies RuleOptions;

export const optionsSchema = [
  {
    type: "object",
    properties: {
      maxLength: { type: "integer", required: true },
      ignoreUrls: { type: "boolean", required: true },
    },
  },
];
