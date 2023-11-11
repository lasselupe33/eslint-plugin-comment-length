// @ts-check

const eslintPluginCommentLength = require("eslint-plugin-comment-length");

/**
 * ESLint config.
 * @satisfies {Array<import("eslint").Linter.FlatConfig>}
 */
const eslintConfig = [eslintPluginCommentLength.configs["flat/recommended"]];

module.exports = eslintConfig;
