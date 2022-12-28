# eslint-plugin-comment-length

This plugin provides [ESLint](https://eslint.org/) rules that limit the line length of your comments. Furthermore, an automatic fix is included such that you can save time manually formatting your comments.

This project aims to ease the process of writing long comments where each line needs to be cropped to a specific line length. This is similar to the [`max-len`](https://eslint.org/docs/rules/max-len) ESLint rule, but violations can be automatically fixed.

**NB:** There are several cases wherein the rules will not attempt to automatically format comments. This is to accomodate cases wherein it is *not* desired to break a comment into multiple lines. Examples include comments that:

- are not on their own lines.
- include `eslint-[enable|disable]-*`, `stylelint-[enable|disable]-*`, `tslint:[enable|disable]`.
- consists of code snippets.
- are wrapped within backticks (e.g. \```some-comment\```)
- are part of JSDoc-like comments (i.e. starting with '@')

Specific cases will be expanded upon in the `example` sections below.

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

Locates single-line commments, i.e. `// comment`, and ensures that each line never exceeds the configured length.

If a line violates this rule, the auto-fixer will attempt to combine logical groups of single-line comments and reformat those to ensure that each line is below the configured max length.

```ts
// this is one logical comment block. It will be automatically split into multiple lines if fixed. Especially if the content is very very very very very very long.
// This is the second line of the block.
// This is considered as a new block since the line above does not overflow.

// This line is also considered as a singular block.
```

Which will be transformed into:

```ts
// this is one logical comment block. It will be automatically split into
// multiple lines if fixed. Especially if the content is very very very very
// very very long. This is the second line of the block.
// This is considered as a new block since the line above does not overflow.

// This line is also considered as a singular block.
```

#### Options

```json
{
  "comment-length/limit-single-line-comments": [
    "warn",
    {
      "maxLength": 80,
      "ignoreUrls": true
    }
  ]
}
```

#### Examples

##### Basic

```ts
// this is one logical comment block. It will be automatically split into multiple lines if fixed. Especially if the content is very very very very very very long.
```

Will be fixed into:

```ts
// this is one logical comment block. It will be automatically split into
// multiple lines if fixed. Especially if the content is very very very very
// very very long.
```

##### Leading whitespace

```ts
// When fixing this comment-block, then the leading whitespace on the following line will be discarded.
//    white-space will be discarded when fixing.
```

Will be fixed into

```ts
// When fixing this comment-block, then the leading whitespace on the following
// line will be discarded. white-space will be discarded when fixing.
```

##### Must not be a comment with special semantics

The comments below will NOT be automatically fixable (as this will break functionality).

```ts
// eslint-disable-next-line comment-length/limit-single-line-comments, comment-length/limit-multi-line-comments
// styleline-disable-next-line some-css-plugin/some-css-rule, ...
// tslint:disable ...
```

##### Must be on own line

The comment below will NOT be automatically fixable (as it is not on its own line).
This has been done as there is rarely much space available when a comment shares a line with actual code.

```ts
const myVariable = Math.max(0, Math.min(1, window.someValue)); // clamps the external value between 0 and 1.
```

##### Includes a comment within the comment

The comment below will NOT be automatically fixable as it includes a comment within itself.

The rationale behind this decision is that developers at times will have to out-comment snippets of code when debugging. When this happens comments may also be commented out (perhaps accidentally). In this case we would like to preserve the structure of the original comment, such that when it is commented back in it follows the original layout.

```ts
/** Here is my comment which // includes a very very long comment within itself. */
```

##### Includes a code snippet

The comment below will NOT be automatically fixable as it includes a comment within itself.

The rationaly is essentially the same as above. In particular we wish to avoid breaking lines when code is out-commented during debugging.

```ts
// const myVariableWhichDefinitelyOverflows = window.getComputedStyle(document.body).accentColor;
```


### `comment-length/limit-multi-line-comments`

Locates multi-line comments, i.e. `/* comment */` and ensures that each line in the comment never exceeds the configured length.

If a line violates this rule, the auto-fixer will attempt to combine logical groups of lines inside the comment and reformat those to ensure that each line is below the configured max length.

As an example the comment below, which combines several comments from the `ESLint` source code, is perfectly valid:

```ts
/*
 * NOTE: The CLI object should *not* call process.exit() directly. It should
 * only return exit codes. This allows other programs to use the CLI object and
 * still control when the program exits.
 * 
 * @property {("directive" | "problem" | "suggestion" | "layout")[]} [fixType] Specify the types of fixes to apply (directive, problem, suggestion, layout)
 * 
 * @example
 * ```tsx
 * const someValueAfterProcessing = process(value, (node) => ({
 *   ...node,
 *   newProp: 2, // @TODO, insert the correct value of newProp once available here. Do note that I overflow, but do not trigger an automatic fix.
 * }));
 * ```
 */
```

But the following would be considered as a violation:

```ts
/**
 * NOTE: The CLI object should *not* call process.exit() directly. It should only return exit codes. This allows other programs to use the CLI object and still control when the program exits.
 */
```

Which will be transformed into the snippet below when applying the automatic fix:

```ts
/*
 * NOTE: The CLI object should *not* call process.exit() directly. It should
 * only return exit codes. This allows other programs to use the CLI object and
 * still control when the program exits.
 */
```

#### Options

```json
{
  "comment-length/limit-multi-line-comments": [
    "warn",
    {
      "maxLength": 80,
      "ignoreUrls": true
    }
  ]
}
```

#### Examples

@TODO: Add several examples introducing additional edge-case behavior related to backticks, JSDoc-like comments etc.

##### Must not be a comment with special semantics

The comments below will NOT be automatically fixable (as this will break functionality).

```ts
/** eslint-disable comment-length/limit-single-line-comments, comment-length/limit-multi-line-comments */
```

##### Includes a comment within the comment

The comment below will NOT be automatically fixable as it includes a comment within itself.

The rationale behind this decision is that developers at times will have to out-comment snippets of code when debugging. When this happens comments may also be commented out (perhaps accidentally). In this case we would like to preserve the structure of the original comment, such that when it is commented back in it follows the original layout.

```ts
/** Here is my comment which // includes a very very long comment within itself. */
```

##### Includes a code snippet

The comment below will NOT be automatically fixable as it includes a comment within itself.

The rationaly is essentially the same as above. In particular we wish to avoid breaking lines when code is out-commented during debugging.

```ts
/** 
 * const myVariableWhichDefinitelyOverflows = window.getComputedStyle(document.body).accentColor;
 */
```