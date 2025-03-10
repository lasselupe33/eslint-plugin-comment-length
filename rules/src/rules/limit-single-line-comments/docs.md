# `comment-length/limit-single-line-comments`

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

## Options

```jsonc
{
  "comment-length/limit-single-line-comments": [
    "warn",
    {
      "mode": "overflow-only" | "compact-on-overflow" | "compact",
      "maxLength": 80,
      "logicalWrap": true,
      "ignoreUrls": true,
      "ignoreCommentsWithCode": true,
      "tabSize": 2,
      "semanticComments": ["<string>"],
    }
  ]
}
```

## Examples

### Basic

```ts
// this is one logical comment block. It will be automatically split into multiple lines if fixed. Especially if the content is very very very very very very long.
```

Will be fixed into:

```ts
// this is one logical comment block. It will be automatically split into
// multiple lines if fixed. Especially if the content is very very very very
// very very long.
```

### Indentation

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

### Must not be a comment with special semantics

The comments below will NOT be automatically fixable (as this will break functionality).

```ts
// eslint-disable-next-line comment-length/limit-single-line-comments, comment-length/limit-multi-line-comments
// styleline-disable-next-line some-css-plugin/some-css-rule, ...
// tslint:disable ...
```

### Must be on own line

The comment below will NOT be automatically fixable (as it is not on its own line).
This has been done as there is rarely much space available when a comment shares a line with actual code.

```ts
const myVariable = Math.max(0, Math.min(1, window.someValue)); // clamps the external value between 0 and 1.
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
// const myVariableWhichDefinitelyOverflows = window.getComputedStyle(document.body).accentColor;
```
