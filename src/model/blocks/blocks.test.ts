import { describe, expect, it } from 'vitest';
import { mergeBlocks, splitBlock } from './blocks';
import { getBlockTextLength, getDocumentText, normalizeDocument } from '../document';
import type { InlineMark, ParagraphBlock } from '../types';

const createRng = (seed: number) => {
  let state = seed;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

const randomInt = (next: () => number, minimum: number, maximum: number): number =>
  Math.floor(next() * (maximum - minimum + 1)) + minimum;

const randomMarks = (next: () => number): InlineMark[] => {
  const value = randomInt(next, 0, 3);

  if (value === 0) {
    return [];
  }

  if (value === 1) {
    return ['bold'];
  }

  if (value === 2) {
    return ['italic'];
  }

  return [{ type: 'link', href: `https://example.com/${randomInt(next, 1, 3)}` }];
};

const randomBlock = (next: () => number): ParagraphBlock => {
  const textLength = randomInt(next, 1, 24);
  let cursor = 0;
  const children: ParagraphBlock['children'] = [];

  while (cursor < textLength) {
    const runLength = Math.min(randomInt(next, 1, 5), textLength - cursor);
    children.push({
      text: 'x'.repeat(runLength),
      marks: randomMarks(next),
    });
    cursor += runLength;
  }

  return normalizeDocument({
    blocks: [{ type: 'paragraph', id: 'block-1', children }],
  }).blocks[0];
};

const blockToText = (block: ParagraphBlock): string =>
  getDocumentText({
    blocks: [block],
  });

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

  it('preserves content across randomized split and merge operations', () => {
    const next = createRng(8192);

    for (let index = 0; index < 120; index += 1) {
      const original = randomBlock(next);
      const originalText = blockToText(original);
      const originalClone = structuredClone(original);
      const offset = randomInt(next, -12, getBlockTextLength(original) + 12);

      const [left, right] = splitBlock(original, offset);
      const merged = mergeBlocks(left, right);

      expect(original).toEqual(originalClone);
      expect(blockToText(left) + blockToText(right)).toBe(originalText);
      expect(blockToText(merged)).toBe(originalText);
      expect(normalizeDocument({ blocks: [merged] }).blocks[0]).toEqual(merged);
    }
  });
});
