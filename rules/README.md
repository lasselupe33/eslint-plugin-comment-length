# eslint-plugin-comment-length

ESLint rules that limits the line length of your comments.

This project aims to ease the process of writing long comments where each line
needs to be cropped to a specific line length. Think of the eslint rule
`max-len` with "comments" enabled while also having the benefit of auto-fixing issues.

The plugin is in its early stages and has only been tested with limited use cases. As such, the plugin will probably not work with comments *"that matters"* such as JSDoc comments.

**NB**: Rules will not apply to comments that are not on their own lines and comments that include the strings `eslint-disable-*` and `stylelint-disable-*` to avoid breaking functionality.

## Installation

`yarn add --dev eslint-plugin-comment-length`

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

### `limit-single-line-comments`

Locates single line commments, i.e. `// comment`, and ensures that each line never exceeds the configured length.

When a line has been exceeded then auto-fixes can be applied which will attempt to combine logical groups of single-line comments and reformatting these to ensure that each line is below the configured max length.

Only line-breaks are considered as splits.

### `limit-multi-line-comments`

Locates multi line comments, i.e. `/* comment */` and ensures that each line in the comment never exceeds the configured length.