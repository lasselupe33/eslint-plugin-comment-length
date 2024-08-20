import type { Context } from "../../typings.context";
import { isLineOverflowing } from "../../utils/is-line-overflowing";

import type { MultilineBlock } from "./typings.block";

/**
 * captures the next logical group/block in the provided multi-line comment
 * content, based on a set of rules.
 *
 * 1) Everything within a set of back-ticks (``) is ignored, as this is used
 * to explicitly declare that the content should not be auto-fixed.
 *
 * 2) Lines that are not on the same indentation-level will not be recognized
 * as part of the same block.
 *
 * 3) Lines separated by a new-line will not be considered as part of the same
 * block.
 *
 * 4) Lines will only be grouped in case the current line of the block to be
 * constructed actually is overflowing. This avoids issues where auto-fixing
 * 'sucks' a line up even though the previous line should have been considered
 * a logical end to a block.
 */
export function captureNextBlock(
  ignoreFollowingLines: boolean,
  initialStartIndex: number,
  context: Context,
): [Omit<MultilineBlock, "value">, boolean] {
  let ignoreLines = ignoreFollowingLines;
  let startIndex = initialStartIndex;

  // the provided startIndex may not necessarily indicate the startIndex of the
  // next logical block. (it may e.g. just point to a blank line)
  // as such we need to determine the actual start of the next block.
  for (let i = initialStartIndex; i < context.comment.lines.length; i++) {
    const line = context.comment.lines[i];

    // ensure that lines within backticks is skipped (and that the line itself
    // is ignored as it acts as a marker).
    if (
      line?.trimStart().startsWith("` ") ||
      line?.trimStart().startsWith("``")
    ) {
      ignoreLines = !ignoreLines;
      continue;
    }

    startIndex = i;

    if (line && line.trim() !== "" && !ignoreLines) {
      break;
    }
  }

  const blockLines: string[] = context.comment.lines.slice(
    startIndex,
    startIndex + 1,
  );

  // In case we could not resolve the start of a new block, then we cannot
  // continue...
  if (blockLines.length === 0) {
    return [
      {
        lines: blockLines,
        startIndex,
        endIndex: startIndex,
        lineOffsets: [],
      },
      ignoreLines,
    ];
  }

  // ... else we can begin analysing the following lines to determine if they
  // are to be added to the current group
  for (let i = startIndex; i < context.comment.lines.length; i++) {
    const currLine = context.comment.lines[i];
    const nextLine = context.comment.lines[i + 1];

    if (!currLine) {
      break;
    }

    const currLineOffset =
      currLine
        .match(/^( |\t)*/)?.[0]
        ?.split("")
        .reduce(
          (acc, curr) => acc + (curr === "\t" ? context.tabSize : 1),
          0,
        ) ?? 0;

    const nextLineOffset =
      nextLine
        ?.match(/^( |\t)*/)?.[0]
        ?.split("")
        .reduce(
          (acc, curr) => acc + (curr === "\t" ? context.tabSize : 1),
          0,
        ) ?? 0;

    if (
      !nextLine ||
      nextLine.trim() === "" ||
      currLineOffset !== nextLineOffset ||
      (context.mode === "overflow-only" &&
        !isLineOverflowing(
          `${currLine} ${nextLine.trimStart().split(" ")[0] ?? ""}`.trimEnd(),
          context,
        ))
    ) {
      return [
        {
          lines: blockLines,
          startIndex,
          endIndex: i,
          lineOffsets: blockLines.map((it, lineIndex) => {
            const whitespaceString = context.comment.value
              .split("\n")
              [startIndex + lineIndex]?.includes("*")
              ? it.match(/^( |\t)*/)?.[0] ?? ""
              : " ";

            return {
              string: whitespaceString,
              size:
                whitespaceString
                  .split("")
                  .reduce(
                    (acc, curr) => acc + (curr === "\t" ? context.tabSize : 1),
                    0,
                  ) ?? 0,
            };
          }),
        },
        ignoreLines,
      ];
    }

    blockLines.push(nextLine);
  }

  return [
    {
      lines: blockLines,
      startIndex,
      endIndex: context.comment.lines.length,
      lineOffsets: blockLines.map((it, lineIndex) => {
        const whitespaceString = context.comment.value
          .split("\n")
          [startIndex + lineIndex]?.includes("*")
          ? it.match(/^( |\t)*/)?.[0] ?? ""
          : " ";

        return {
          string: whitespaceString,
          size:
            whitespaceString
              .split("")
              .reduce(
                (acc, curr) => acc + (curr === "\t" ? context.tabSize : 1),
                0,
              ) ?? 0,
        };
      }),
    },
    ignoreLines,
  ];
}
