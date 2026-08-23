// Split logic for converting one block into left and right fragments.
import type { Block, TextSpan } from '../../types';
import { mergeAdjacentRuns, splitRunAt } from '../../runs';
import {
  LEFT_BLOCK_SUFFIX,
  RIGHT_BLOCK_SUFFIX,
  appendIfNotEmpty,
  clampOffset,
  cloneSpan,
  getBlockTextLength,
} from '../utils/shared';

const createSplitBlock = (sourceBlock: Block, suffix: string, spans: TextSpan[]): Block => ({
  type: sourceBlock.type,
  id: `${sourceBlock.id}-${suffix}`,
  children: mergeAdjacentRuns(spans),
});

const splitSpanCollection = (
  spans: TextSpan[],
  splitOffset: number,
): { leftSpans: TextSpan[]; rightSpans: TextSpan[] } => {
  const leftSpans: TextSpan[] = [];
  const rightSpans: TextSpan[] = [];
  let cursor = 0;

  for (const span of spans) {
    const spanStart = cursor;
    const spanEnd = cursor + span.text.length;

    if (splitOffset <= spanStart) {
      rightSpans.push(cloneSpan(span));
    } else if (splitOffset >= spanEnd) {
      leftSpans.push(cloneSpan(span));
    } else {
      const [leftSpan, rightSpan] = splitRunAt(span, splitOffset - spanStart);
      appendIfNotEmpty(leftSpans, leftSpan);
      appendIfNotEmpty(rightSpans, rightSpan);
    }

    cursor = spanEnd;
  }

  return { leftSpans, rightSpans };
};

// Splits one block at a text offset and returns the left and right blocks.
export const splitBlock = (block: Block, offset: number): [Block, Block] => {
  const safeOffset = clampOffset(offset, 0, getBlockTextLength(block));
  const { leftSpans, rightSpans } = splitSpanCollection(block.children, safeOffset);

  return [
    createSplitBlock(block, LEFT_BLOCK_SUFFIX, leftSpans),
    createSplitBlock(block, RIGHT_BLOCK_SUFFIX, rightSpans),
  ];
};
