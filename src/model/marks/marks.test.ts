import { describe, expect, it } from 'vitest';
import { clearInlineMark, getSelectionMarks, toggleInlineMark } from './marks';
import { normalizeDocument } from '../document';
import { buildSelection } from '../../utils';

const createRng = (seed: number) => {
  let state = seed;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

const randomInt = (next: () => number, minimum: number, maximum: number): number =>
  Math.floor(next() * (maximum - minimum + 1)) + minimum;

describe('mark helpers', () => {
  it('toggles bold across a selection', () => {
    const documentModel = normalizeDocument({
      blocks: [
        {
          type: 'paragraph',
          id: 'block-1',
          children: [{ text: 'Hello', marks: [] }],
        },
      ],
    });

    expect(
      toggleInlineMark(
        documentModel,
        {
          anchor: { blockId: 'block-1', offset: 0 },
          focus: { blockId: 'block-1', offset: 5 },
        },
        'bold',
      ).blocks[0].children,
    ).toEqual([{ text: 'Hello', marks: ['bold'] }]);
  });

  it('reports active marks for the current selection', () => {
    const documentModel = normalizeDocument({
      blocks: [
        {
          type: 'paragraph',
          id: 'block-1',
          children: [{ text: 'Hello', marks: ['italic'] }],
        },
      ],
    });

    expect(
      getSelectionMarks(documentModel, {
        anchor: { blockId: 'block-1', offset: 0 },
        focus: { blockId: 'block-1', offset: 5 },
      }),
    ).toEqual(['italic']);
  });

  it('double toggle is identity on randomized ranges', () => {
    const next = createRng(73);
    const marks = ['bold', 'italic'] as const;

    for (let index = 0; index < 100; index += 1) {
      const textLength = randomInt(next, 1, 24);
      const text = 'x'.repeat(textLength);
      const start = randomInt(next, 0, textLength);
      const end = randomInt(next, start, textLength);
      const mark = marks[randomInt(next, 0, marks.length - 1)];

      const documentModel = normalizeDocument({
        blocks: [{ type: 'paragraph', id: 'block-1', children: [{ text, marks: [] }] }],
      });

      const selection = buildSelection('block-1', start, 'block-1', end);
      const toggled = toggleInlineMark(documentModel, selection, mark);
      const toggledTwice = toggleInlineMark(toggled, selection, mark);

      expect(toggledTwice).toEqual(documentModel);
      expect(normalizeDocument(toggled)).toEqual(toggled);
    }
  });

  it('does not modify document for collapsed selections', () => {
    const documentModel = normalizeDocument({
      blocks: [
        { type: 'paragraph', id: 'block-1', children: [{ text: 'Hello world', marks: [] }] },
      ],
    });

    const collapsed = buildSelection('block-1', 4, 'block-1', 4);

    expect(toggleInlineMark(documentModel, collapsed, 'bold')).toEqual(documentModel);
  });

  it('removes a link regardless of its URL', () => {
    const documentModel = normalizeDocument({
      blocks: [
        {
          type: 'paragraph',
          id: 'block-1',
          children: [{ text: 'Hello', marks: [{ type: 'link', href: 'https://example.com' }] }],
        },
      ],
    });

    expect(
      clearInlineMark(documentModel, buildSelection('block-1', 0, 'block-1', 5), {
        type: 'link',
        href: '',
      }).blocks[0].children,
    ).toEqual([{ text: 'Hello', marks: [] }]);
  });
});
