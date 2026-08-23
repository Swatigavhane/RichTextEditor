// Canonical normalization for spans, blocks, and whole document models.
import type { DocumentModel, InlineMark, ParagraphBlock, TextSpan } from '../../types';
import { DEFAULT_BLOCK_ID, EMPTY_TEXT_SPAN } from '../../constants';
import { cloneSpan } from './clone';

// Creates a stable comparison key for a mark collection.
const marksKey = (marks: InlineMark[]): string => JSON.stringify(marks);

// Checks whether two mark collections are equivalent.
const haveSameMarks = (left: InlineMark[], right: InlineMark[]): boolean =>
  marksKey(left) === marksKey(right);

// Removes empty spans from a span collection.
const toNonEmptySpans = (spans: TextSpan[]): TextSpan[] =>
  spans.filter((span) => span.text.length > 0);

// Merges neighboring spans that use the same marks.
const mergeAdjacentSpansWithSameMarks = (spans: TextSpan[]): TextSpan[] => {
  const merged: TextSpan[] = [];

  for (const span of spans) {
    const previous = merged[merged.length - 1];

    if (previous && haveSameMarks(previous.marks, span.marks)) {
      previous.text += span.text;
      continue;
    }

    merged.push(cloneSpan(span));
  }

  return merged;
};

// Normalizes spans and guarantees an empty fallback span when needed.
const normalizeSpans = (spans: TextSpan[]): TextSpan[] => {
  const nonEmptySpans = toNonEmptySpans(spans);

  if (nonEmptySpans.length === 0) {
    return [EMPTY_TEXT_SPAN];
  }

  const normalizedSpans = mergeAdjacentSpansWithSameMarks(nonEmptySpans);

  return normalizedSpans.length > 0 ? normalizedSpans : [EMPTY_TEXT_SPAN];
};

// Rebuilds one paragraph with normalized children.
const normalizeBlock = (block: ParagraphBlock): ParagraphBlock => ({
  type: 'paragraph',
  id: block.id,
  children: normalizeSpans(block.children),
});

// Ensures a document always contains normalized paragraph blocks.
export const normalizeBlocks = (blocks: ParagraphBlock[]): ParagraphBlock[] => {
  if (blocks.length === 0) {
    return [
      {
        type: 'paragraph',
        id: DEFAULT_BLOCK_ID,
        children: [EMPTY_TEXT_SPAN],
      },
    ];
  }

  return blocks.map(normalizeBlock);
};

// Normalizes the full document structure and its text spans.
export const normalizeDocumentModel = (documentModel: DocumentModel): DocumentModel => ({
  blocks: normalizeBlocks(documentModel.blocks),
});
