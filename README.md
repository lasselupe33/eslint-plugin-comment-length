# eslint-plugin-comment-length

This plugin provides [ESLint](https://eslint.org/) rules that limit the line length of your comments. Furthermore, an automatic fix is included such that you can save time manually formatting your comments. As such it is **recommended** to apply this rule every time a file is saved in order to avoid the hassle of manually formatting comments.

```ts
// Here is a comment that is too long to fit on the current line, given the configured maximum.
// It also includes a line afterwards which originally isn't too wide to fit.
```

Which will be transformed into the following:

```ts
// Here is a comment that is too long to fit on the current line, given the
// configured maximum. It also includes a line afterwards which originally isn't
// too wide to fit.
```

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

### Tagged Template Literals

In case you want to detect and fix overflow of JavaScript comments within `tagged template literals`, e.g. when using CSS-in-JS, you need to add the following rule to your configuration object:

```jsonc
{
  "rules": {
    "comment-length/limit-tagged-template-literal-comments": ["warn", {
      "tags": ["css"] // will perform comment analysis on all tagged template literals named `css`
    }]
  }
}
```

See [comment-length/limit-tagged-template-literal-comments](#comment-lengthlimit-tagged-template-literal-comments) for additional information.

## Configuration

Both rules accept the same set of configuration options, as described by the
provided TypeScript type declaration.

Please refer to the individual rules for examples of how to apply these
configurations in your ESLint config.

```ts
type Options = {
  /**
   * specifies how the auto-fix wrapping mechanism functions.
   *
   * - "overflow-only" ensures that only overflowing lines are reflowed to new
   * lines,
   *
   * - whereas "compact" tries to produce as compact blocks as possible,
   * potentially merging multiple nearby lines even though no overflow was
   * occuring on the lines.
   *
   * - Finally, "compact-on-overflow" attempts to produce as compact blocks as
   * possible, however only when overflow within a block has been detected.
   *
   * @default overflow-only
   */
  mode: "overflow-only" | "compact-on-overflow" | "compact";

  /**
   * specifies the maxmium length that a comment is allowed to take
   *
   * @default 80
   */
  maxLength: number;

  /**
   * in case you are using tabs to indent your code, then this plugin needs to
   * know the configured tab size, in order to properly determine when a comment
   * exceeds the configured max length.
   *
   * If you are using VSCode, then this option should match the
   * `editor.tabSize` option.
   *
   * @default 2
   */
  tabSize: number;

  /**
   * if set to true, then overflow lines including comments will be ignored
   *
   * @default true
   */
  ignoreUrls: boolean;

  /**
   * attempts to avoid reflowing comments that contains code as this may break
   * the semantic meaning of the code.
   *
   * NB: This option causes ESLint to be run on comment content in an attempt
   * to see if the code inside is parsable.
   *
   * @default true
   */
  ignoreCommentsWithCode: boolean;

  /**
   * attempts to wrap at logical pauses in the comments like punctuation
   *
   * This will often wrap the text sooner than if this was disabled,
   * but it should be easier to read.
   *
   * @default true
   */
  logicalWrap: boolean;
};
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

```jsonc
{
  "comment-length/limit-single-line-comments": [
    "warn",
    {
      "mode": "overflow-only" | "compact-on-overflow" | "compact",
      "maxLength": 80,
      "ignoreUrls": true,
      "ignoreCommentsWithCode": true,
      "logicalWrap": true,
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

##### Indentation

When fixing this comment-block, then the leading whitespace on the following line will currently be discarded. This may change in the future.

As an example:

```ts
// When fixing this comment-block, then the leading whitespace on the following line will be discarded.
//    white-space will be discarded when fixing.
```

Will be fixed into:

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

```jsonc
{
  "comment-length/limit-multi-line-comments": [
    "warn",
    {
      "mode": "overflow-only" | "compact-on-overflow" | "compact",
      "maxLength": 80,
      "ignoreUrls": true,
      "ignoreCommentsWithCode": true,
      "logicalWrap": true,
    }
  ]
}
```

#### Examples

##### Basic

```ts
/**
 * This is a single block.
 * This is another block which violates the maximum length. This block will as such be automatically fixed.
 * This is part of the previous block.
 * 
 * This is a third block.
 */
```

```ts
/**
 * This is a single block.
 * This is another block which violates the maximum length. This block will as
 * such be automatically fixed. This is part of the previous block.
 *
 * This is a third block.
 */
```

##### JSDoc

In order to preserve semantics of JSDoc-like comments the automatic fix will not apply to lines that seems to be part of a JSDoc comment (i.e. starting with the character "@").

At times, when JSDoc declarations (e.g. @example) span multiple lines, then it may be desired to combine with the `backtick` escape-hatch described below.

```ts
/**
 * @example Here is my JSDoc-comment which will not be automatically fixable in order to avoid altering semantics.
 */
```

##### Backticks

Backticks inside a multi-line comment acts as an escape hatch for the automatic fix. In other words, all content within backticks will never be considered as a block that can be automatically fixed.

```ts
/**
 * @example
 * ```ts
 * Everything within backticks will not be automatically formatted. They essientially acts as an escape-hatch for the automatic fix.
 * ```
 */
```

##### Indentation

When capturing logical blocks within a multi-line comment the rule will consider indentation levels. If two lines do not share the same indentation level, then they will never be considered as part of the same block.

This is illustrated with the following example:

```ts
/**
 * This is a single block which overflows the default maximum line-length (80 characters).
 *    Since this line has a different indentation level it will be considered as a separate block (which also overflows!)
 */
```

Will be fixed into:

```ts
/**
 * This is a single block which overflows the default maximum line-length (80
 * characters).
 *    Since this line has a different indentation level it will be considered
 *    as a separate block (which also overflows!)
 */
```

##### Single-line

```ts
/** In case a multi-line comment is on a single line and it violates the configured max-length, then it will be split into multiple lines automatically. */
```

Will be fixed into:

```ts
/**
 * In case a multi-line comment is on a single line and it violates the
 * configured max-length, then it will be split into multiple lines
 * automatically.
 */
```

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

### `comment-length/limit-tagged-template-literal-comments`

Locates javascript comments, i.e. `/* comment */` or `// comment` within `tagged template literals` and ensures that each line in the comment never exceeds the configured length.

If a line violates this rule, the auto-fixer will attempt to combine logical groups of lines inside the comment and reformat those to ensure that each line is below the configured max length.

**NB** This rule is a basic wrapper on top of the rules `comment-length/limit-single-line-comments` and `comment-length/limit-multi-line-comments` that parses comments within tagged template literals and then forwards these comments to the other rules.

This rule is especially intended for `CSS-in-JS` wherein comments may be used. As an example consider the snippet below:

```ts
const myCss = css`
  /** we have decided to use this color due to its unique qualities etc. Unfortunately this line is far too long, and tedious to fix manually. */
  color: green;
`;
```

Normally the comment within the tagged template literal will not be automatically fixed. However, when this rule is included, then the snippet above will be transformed into the following:

```ts
const myCss = css`
  /**
   * we have decided to use this color due to its unique qualities etc.
   * Unfortunately this line is far too long, and tedious to fix manually.
   */
  color: green;
`;
```

## Options

```jsonc
{
  "comment-length/limit-multi-line-comments": [
    "warn",
    {
      "tags": ["css"], // include names of all tags that comment detection should be performed on.

      // the configurations below will be propagated to the other rules that this rule extends.
      "mode": "overflow-only" | "compact-on-overflow" | "compact",
      "maxLength": 80,
      "ignoreUrls": true,
      "ignoreCommentsWithCode": true,
      "logicalWrap": true,
    }
  ]
}
```
