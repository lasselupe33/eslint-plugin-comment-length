
# `comment-length/limit-tagged-template-literal-comments`

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
      "logicalWrap": true,
      "ignoreUrls": true,
      "ignoreCommentsWithCode": true,
      "tabSize": 2
    }
  ]
}
```
