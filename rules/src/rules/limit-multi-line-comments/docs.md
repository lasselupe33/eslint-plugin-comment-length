
# `comment-length/limit-multi-line-comments`

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

## Options

```json
{
  "comment-length/limit-multi-line-comments": [
    "warn",
    {
      "maxLength": 80,
      "ignoreUrls": true,
      "ignoreCommentsWithCode": true
    }
  ]
}
```

## Examples

### Basic

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

### JSDoc

In order to preserve semantics of JSDoc-like comments the automatic fix will not apply to lines that seems to be part of a JSDoc comment (i.e. starting with the character "@").

At times, when JSDoc declarations (e.g. @example) span multiple lines, then it may be desired to combine with the `backtick` escape-hatch described below.

```ts
/**
 * @example Here is my JSDoc-comment which will not be automatically fixable in order to avoid altering semantics.
 */
```

### Backticks

Backticks inside a multi-line comment acts as an escape hatch for the automatic fix. In other words, all content within backticks will never be considered as a block that can be automatically fixed.

```ts
/**
 * @example
 * ```ts
 * Everything within backticks will not be automatically formatted. They essientially acts as an escape-hatch for the automatic fix.
 * ```
 */
```

### Indentation

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

### Single-line

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

### Must not be a comment with special semantics

The comments below will NOT be automatically fixable (as this will break functionality).

```ts
/** eslint-disable comment-length/limit-single-line-comments, comment-length/limit-multi-line-comments */
```

### Includes a comment within the comment

The comment below will NOT be automatically fixable as it includes a comment within itself.

The rationale behind this decision is that developers at times will have to out-comment snippets of code when debugging. When this happens comments may also be commented out (perhaps accidentally). In this case we would like to preserve the structure of the original comment, such that when it is commented back in it follows the original layout.

```ts
/** Here is my comment which // includes a very very long comment within itself. */
```

### Includes a code snippet

The comment below will NOT be automatically fixable as it includes a comment within itself.

The rationaly is essentially the same as above. In particular we wish to avoid breaking lines when code is out-commented during debugging.

```ts
/** 
 * const myVariableWhichDefinitelyOverflows = window.getComputedStyle(document.body).accentColor;
 */
```
