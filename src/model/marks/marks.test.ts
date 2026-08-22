import { describe, expect, it } from 'vitest';
import { getActiveMarks, toggleMark } from './index';
import { normalizeDocument } from '../document';

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
      toggleMark(
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
      getActiveMarks(documentModel, {
        anchor: { blockId: 'block-1', offset: 0 },
        focus: { blockId: 'block-1', offset: 5 },
      }),
    ).toEqual(['italic']);
  });
});