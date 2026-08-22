import { describe, expect, it } from 'vitest';
import { mergeBlocks, splitBlock } from './blocks';

describe('block helpers', () => {
  it('splits a block into left and right blocks', () => {
    const [left, right] = splitBlock(
      {
        type: 'paragraph',
        id: 'block-1',
        children: [{ text: 'Hello', marks: [] }],
      },
      2,
    );

    expect(left.children).toEqual([{ text: 'He', marks: [] }]);
    expect(right.children).toEqual([{ text: 'llo', marks: [] }]);
  });

  it('merges two blocks together', () => {
    expect(
      mergeBlocks(
        {
          type: 'paragraph',
          id: 'block-1',
          children: [{ text: 'He', marks: [] }],
        },
        {
          type: 'paragraph',
          id: 'block-2',
          children: [{ text: 'llo', marks: [] }],
        },
      ),
    ).toEqual({
      type: 'paragraph',
      id: 'block-1',
      children: [{ text: 'Hello', marks: [] }],
    });
  });
});
