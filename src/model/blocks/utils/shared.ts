// Shared low-level helpers used by block split and merge operations.
import type { Block, TextSpan } from '../../types';
import { LEFT_BLOCK_SUFFIX, RIGHT_BLOCK_SUFFIX } from '../../constants';

export { LEFT_BLOCK_SUFFIX, RIGHT_BLOCK_SUFFIX };

export const cloneSpan = (span: TextSpan): TextSpan => ({
  text: span.text,
  marks: [...span.marks],
});

export const getBlockTextLength = (block: Block): number =>
  block.children.reduce((length, span) => length + span.text.length, 0);

export const clampOffset = (offset: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(offset, minimum), maximum);

export const appendIfNotEmpty = (spans: TextSpan[], span: TextSpan) => {
  if (span.text.length > 0) {
    spans.push(span);
  }
};
