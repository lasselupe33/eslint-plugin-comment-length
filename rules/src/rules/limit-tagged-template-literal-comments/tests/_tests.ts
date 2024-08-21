import { getCode } from "../../../utils/testing.get-code.js";

import {
  type RuleOptions,
  defaultOptions as baseOptions,
} from "../../../typings.options.js";
import { MessageIds } from "../../../const.message-ids.js";
import { limitTaggedTemplateLiteralCommentsRule } from "../rule.js";
import { RuleTester } from "@typescript-eslint/rule-tester";

const ruleTester = new RuleTester();

const defaultOptions = [{ ...baseOptions[0], tags: ["css"] }] as RuleOptions &
  [{ tags: string[] }];

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
        MessageIds.EXCEEDS_MAX_LENGTH,
      ),
      getCode(
        __dirname,
        "invalid.basic-multi-line-overflow",
        defaultOptions,
        MessageIds.EXCEEDS_MAX_LENGTH,
      ),
      getCode(
        __dirname,
        "invalid.malformed",
        defaultOptions,
        MessageIds.EXCEEDS_MAX_LENGTH,
      ),
      getCode(
        __dirname,
        "invalid.malformed-2",
        defaultOptions,
        MessageIds.EXCEEDS_MAX_LENGTH,
      ),
      getCode(
        __dirname,
        "multiple-comments-with-overflow",
        defaultOptions,
        MessageIds.EXCEEDS_MAX_LENGTH,
        6,
      ),
    ],
  },
);
