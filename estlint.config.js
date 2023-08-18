// @ts-check

import eslintPluginCommentLength from "eslint-plugin-comment-length";


/**
 * ESLint config.
 * @satisfies {Array<import("eslint").Linter.FlatConfig>}
 */
const eslintConfig = [
  {
    files: ["**/*.js"],
    plugins: {
      "comment-length": eslintPluginCommentLength,
    },
    rules: {
      "comment-length/limit-single-line-comments": "error",
      "comment-length/limit-multi-line-comments": "error",
    },
  },
];

export default eslintConfig;