import { describe, expect, it } from 'vitest';
import { createEmptyDocument, getDocumentText } from '../../model';
import { buildDocument, buildSelection } from '../../utils';
import { applyInputEvent } from './applyInputEvent';
import { diffText } from './diffText';

const createRng = (seed: number) => {
  let state = seed;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

const randomInt = (next: () => number, minimum: number, maximum: number): number =>
  Math.floor(next() * (maximum - minimum + 1)) + minimum;

const randomText = (next: () => number, maxLength: number): string => {
  const alphabet = 'abc xyz';
  const length = randomInt(next, 0, maxLength);
  let text = '';

  for (let index = 0; index < length; index += 1) {
    text += alphabet[randomInt(next, 0, alphabet.length - 1)];
  }

  return text;
};

describe('apply input event', () => {
  it('reconciles a simple text replacement', () => {
    const result = applyInputEvent(createEmptyDocument(), {
      beforeText: '',
      afterText: 'Hello',
      selection: buildSelection('block-1', 0, 'block-1', 0),
    });

    expect(result.blocks[0].children).toEqual([{ text: 'Hello', marks: [] }]);
  });

  it('reconciles insertion in the middle of existing text', () => {
    const documentModel = buildDocument(['Hello']);
    const result = applyInputEvent(documentModel, {
      beforeText: 'Hello',
      afterText: 'HeXllo',
      selection: buildSelection('block-1', 2, 'block-1', 2),
    });

    expect(getDocumentText(result)).toBe('HeXllo');
  });

  it('preserves a space inserted between words', () => {
    const documentModel = buildDocument(['joejohn']);
    const result = applyInputEvent(documentModel, {
      beforeText: 'joejohn',
      afterText: 'joe john',
      selection: buildSelection('block-1', 3, 'block-1', 3),
    });

    expect(getDocumentText(result)).toBe('joe john');
  });

  it('reconciles deletion using selected range', () => {
    const documentModel = buildDocument(['Hello']);
    const result = applyInputEvent(documentModel, {
      beforeText: 'Hello',
      afterText: 'Ho',
      selection: buildSelection('block-1', 1, 'block-1', 4),
    });

    expect(getDocumentText(result)).toBe('Ho');
  });

  it('preserves the caret after consecutive newline insertions', () => {
    const firstResult = applyInputEvent(createEmptyDocument(), {
      beforeText: '',
      afterText: '\n',
      selection: buildSelection('block-1', 0, 'block-1', 0),
    });
    const secondResult = applyInputEvent(firstResult, {
      beforeText: '\n',
      afterText: '\n\n',
      selection: buildSelection('block-1', 1, 'block-1', 1),
    });

    expect(getDocumentText(secondResult)).toBe('\n\n');
  });

  it('preserves expected text in randomized single-block edits', () => {
    const next = createRng(1224);

    for (let index = 0; index < 120; index += 1) {
      const beforeText = randomText(next, 20);
      const start = randomInt(next, 0, beforeText.length);
      const end = randomInt(next, start, beforeText.length);
      const inserted = randomText(next, 5);
      const afterText = `${beforeText.slice(0, start)}${inserted}${beforeText.slice(end)}`;
      const textDiff = diffText(beforeText, afterText);
      const diffSelection = buildSelection(
        'block-1',
        textDiff.start,
        'block-1',
        textDiff.start + textDiff.deletedText.length,
      );

      const documentModel = buildDocument([beforeText]);
      const result = applyInputEvent(documentModel, {
        beforeText,
        afterText,
        selection: diffSelection,
      });

      expect(getDocumentText(result)).toBe(afterText);
    }
  });
});
