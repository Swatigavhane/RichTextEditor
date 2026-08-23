// Shared low-level helpers used by block split and merge operations.
import type { Block, TextSpan } from '../../types';
import { LEFT_BLOCK_SUFFIX, RIGHT_BLOCK_SUFFIX } from '../../constants';

export { LEFT_BLOCK_SUFFIX, RIGHT_BLOCK_SUFFIX };

// Creates a shallow span copy with independent marks.
/** Creates a copy of a block-operation text span. */
export const cloneSpan = (span: TextSpan): TextSpan => ({
  text: span.text,
  marks: [...span.marks],
});

// Returns the total text length of a block.
export const getBlockTextLength = (block: Block): number =>
  block.children.reduce((length, span) => length + span.text.length, 0);

// Restricts an offset to the supplied inclusive range.
export const clampOffset = (offset: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(offset, minimum), maximum);

// Adds a span only when it contains text.
export const appendIfNotEmpty = (spans: TextSpan[], span: TextSpan) => {
  if (span.text.length > 0) {
    spans.push(span);
  }
};
