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

  it('clamps split offset below zero', () => {
    const [left, right] = splitBlock(
      {
        type: 'paragraph',
        id: 'block-1',
        children: [{ text: 'Hello', marks: [] }],
      },
      -5,
    );

    expect(left.children).toEqual([]);
    expect(right.children).toEqual([{ text: 'Hello', marks: [] }]);
  });

  it('clamps split offset beyond block length', () => {
    const [left, right] = splitBlock(
      {
        type: 'paragraph',
        id: 'block-1',
        children: [{ text: 'Hello', marks: [] }],
      },
      99,
    );

    expect(left.children).toEqual([{ text: 'Hello', marks: [] }]);
    expect(right.children).toEqual([]);
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

  it('does not mutate original blocks while merging', () => {
    const left = {
      type: 'paragraph' as const,
      id: 'block-1',
      children: [{ text: 'Hello', marks: ['bold' as const] }],
    };
    const right = {
      type: 'paragraph' as const,
      id: 'block-2',
      children: [{ text: ' world', marks: [] }],
    };

    const merged = mergeBlocks(left, right);

    merged.children[0].marks.push('italic');

    expect(left.children[0].marks).toEqual(['bold']);
    expect(merged.children[0].marks).toEqual(['bold', 'italic']);
  });
});
