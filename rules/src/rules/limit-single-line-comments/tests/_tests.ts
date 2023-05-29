import path from "path";

import { ESLintUtils } from "@typescript-eslint/utils";
import { getCode } from "../../../utils/testing.get-code";

import { MessageIds, limitSingleLineCommentsRule } from "../rule";
import { defaultOptions } from "../../../const.default-options";

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

ruleTester.run("limit-single-line-comments", limitSingleLineCommentsRule, {
  valid: [
    getCode(__dirname, "valid.basic", defaultOptions),
    getCode(__dirname, "valid.semantic", defaultOptions),
    getCode(__dirname, "valid.same-line", defaultOptions),
    getCode(__dirname, "valid.comment-within-comment", defaultOptions),
    getCode(__dirname, "option.code-within", defaultOptions),
    getCode(__dirname, "option.no-urls", defaultOptions),
  ],
  invalid: [
    getCode(
      __dirname,
      "invalid.basic-overflow",
      defaultOptions,
      MessageIds.EXCEEDS_MAX_LENGTH
    ),
    getCode(
      __dirname,
      "invalid.indentation",
      defaultOptions,
      MessageIds.EXCEEDS_MAX_LENGTH
    ),
    getCode(
      __dirname,
      "option.max-length20",
      [
        {
          ...defaultOptions[0],
          maxLength: 20,
        },
      ] as const,
      MessageIds.EXCEEDS_MAX_LENGTH
    ),
    getCode(
      __dirname,
      "option.code-within",
      [
        {
          ...defaultOptions[0],
          ignoreCommentsWithCode: false,
        },
      ] as const,
      MessageIds.EXCEEDS_MAX_LENGTH
    ),
    getCode(
      __dirname,
      "option.no-urls",
      [
        {
          ...defaultOptions[0],
          ignoreUrls: false,
        },
      ] as const,
      MessageIds.EXCEEDS_MAX_LENGTH
    ),
  ],
});
