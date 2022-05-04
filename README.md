# eslint-plugin-comment-length

This plugin provides [ESLint](https://eslint.org/) rules that limit the line length of your comments.

This project aims to ease the process of writing long comments where each line needs to be cropped to a specific line length. This is similar to the [`max-len`](https://eslint.org/docs/rules/max-len) ESLint rule, but it will automatically fix violations.

The plugin has not been tested extensively. As such, the plugin will probably not work with some JSDoc comments.

Note that the rules that this plugin provides will not apply to comments that:

- are not on their own lines
- include the strings `eslint-disable-*` and `stylelint-disable-*`

## Installation

Yarn:

```bash
yarn add --dev eslint-plugin-comment-length
```

NPM:

```bash
npm i --save-dev eslint-plugin-comment-length
```

## Usage

Add the following to your `.eslintrc` configuration:

```json
{
  "extends": [
    "plugin:comment-length/recommended"
  ]
}
```

## Rules

### `comment-length/limit-single-line-comments`

Locates single line commments, i.e. `// comment`, and ensures that each line never exceeds the configured length.

If a line violates this rule, the auto-fixer will attempt to combine logical groups of single-line comments and reformat those to ensure that each line is below the configured max length.

Only line-breaks are considered as splits.

### Options

```json
{
  "comment-length/limit-single-line-comments": [
    "warn",
    {
      maxLength: 80,
      ignoreUrls: true
    }
  ]
}
```

### `comment-length/limit-multi-line-comments`

Locates multi line comments, i.e. `/* comment */` and ensures that each line in the comment never exceeds the configured length.

### Options

```json
{
  "comment-length/limit-multi-line-comments": [
    "warn",
    {
      maxLength: 80,
      ignoreUrls: true
    }
  ]
}
```
