import path from "path";

import { ESLintUtils } from "@typescript-eslint/utils";
import { getCode } from "../../../utils/testing.get-code";

import { RuleOptions, defaultOptions as baseOptions } from "../../../typings.options";
import { MessageIds } from "../../../const.message-ids";
import { limitTaggedTemplateLiteralCommentsRule } from "../rule";

const ruleTester = new ESLintUtils.RuleTester({
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: path.resolve(__dirname, "..", "..", "..", ".."),
    ecmaFeatures: {
      jsx: true,
    },
  },
});

const defaultOptions = [{ ...baseOptions[0], tags: ["css"] }] as RuleOptions & [{ tags: string[] }];

ruleTester.run(
  "limit-tagged-template-literal-comments",
  limitTaggedTemplateLiteralCommentsRule,
  {
    valid: [],
    invalid: [
      getCode(
        __dirname,
        "invalid.basic-single-line-overflow",
        defaultOptions,
        MessageIds.EXCEEDS_MAX_LENGTH
      ),
      getCode(
        __dirname,
        "invalid.basic-multi-line-overflow",
        defaultOptions,
        MessageIds.EXCEEDS_MAX_LENGTH
      ),
      getCode(
        __dirname,
        "multiple-comments-with-overflow",
        defaultOptions,
        MessageIds.EXCEEDS_MAX_LENGTH,
        6
      ),
    ],
  }
);
