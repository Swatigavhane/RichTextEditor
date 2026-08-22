import { describe, expect, it } from 'vitest';
import {
  createEmptyDocument,
  createParagraph,
  deserializeDocument,
  getDocumentText,
  normalizeDocument,
  serializeDocument,
} from './index';
import type { Document, InlineMark, ParagraphBlock, TextSpan } from '../types';

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

const randomMarks = (next: () => number): InlineMark[] => {
  const marks: InlineMark[] = [];

  if (next() > 0.6) {
    marks.push('bold');
  }

  if (next() > 0.6) {
    marks.push('italic');
  }

  if (next() > 0.75) {
    marks.push({ type: 'link', href: `https://example.com/${randomInt(next, 1, 5)}` });
  }

  return marks;
};

const randomSpan = (next: () => number): TextSpan => ({
  text: randomText(next, 4),
  marks: randomMarks(next),
});

const randomBlock = (next: () => number, index: number): ParagraphBlock => ({
  type: 'paragraph',
  id: `block-${index + 1}`,
  children: Array.from({ length: randomInt(next, 1, 4) }, () => randomSpan(next)),
});

const randomDocument = (next: () => number): Document => ({
  blocks: Array.from({ length: randomInt(next, 1, 4) }, (_, index) => randomBlock(next, index)),
});

const marksKey = (marks: InlineMark[]): string => JSON.stringify(marks);

const expectCanonicalSpans = (documentModel: Document) => {
  for (const block of documentModel.blocks) {
    expect(block.children.length).toBeGreaterThan(0);

    if (block.children.length === 1 && block.children[0].text.length === 0) {
      continue;
    }

    for (let index = 0; index < block.children.length; index += 1) {
      const current = block.children[index];

      expect(current.text.length).toBeGreaterThan(0);

      if (index > 0) {
        const previous = block.children[index - 1];
        expect(marksKey(previous.marks)).not.toBe(marksKey(current.marks));
      }
    }
  }
};

describe('document serialization', () => {
  it('serializes and deserializes a canonical document', () => {
    const documentModel = normalizeDocument({
      blocks: [
        createParagraph('block-1', 'Hello'),
        {
          type: 'paragraph',
          id: 'block-2',
          children: [
            { text: ' ', marks: [] },
            { text: 'world', marks: [] },
          ],
        },
      ],
    });

    const roundTripped = deserializeDocument(serializeDocument(documentModel));

    expect(roundTripped).toEqual(documentModel);
  });

  it('creates an empty document', () => {
    expect(createEmptyDocument()).toEqual({
      blocks: [
        {
          type: 'paragraph',
          id: 'block-1',
          children: [{ text: '', marks: [] }],
        },
      ],
    });
  });

  it('keeps normalization idempotent for randomized documents', () => {
    const next = createRng(20260823);

    for (let index = 0; index < 100; index += 1) {
      const candidate = randomDocument(next);
      const normalized = normalizeDocument(candidate);
      const normalizedAgain = normalizeDocument(normalized);

      expect(normalizedAgain).toEqual(normalized);
      expectCanonicalSpans(normalized);
    }
  });

  it('round-trips normalized randomized documents through serialization', () => {
    const next = createRng(4321);

    for (let index = 0; index < 100; index += 1) {
      const normalized = normalizeDocument(randomDocument(next));
      const serialized = serializeDocument(normalized);
      const deserialized = deserializeDocument(serialized);

      expect(deserialized).toEqual(normalized);
      expect(getDocumentText(deserialized)).toBe(getDocumentText(normalized));
    }
  });
});
