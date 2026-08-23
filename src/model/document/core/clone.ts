// Immutable clone helpers for marks, spans, blocks, and full documents.
import type { DocumentModel, InlineMark, ParagraphBlock, TextSpan } from '../../types';

// Creates a deep copy of inline marks, including link objects.
export const cloneMarks = (marks: InlineMark[]): InlineMark[] =>
  marks.map((mark) => (typeof mark === 'string' ? mark : { ...mark }));

// Creates a copy of a text span and its marks.
export const cloneSpan = (span: TextSpan): TextSpan => ({
  text: span.text,
  marks: cloneMarks(span.marks),
});

// Creates a copy of a paragraph and all of its spans.
export const cloneBlock = (block: ParagraphBlock): ParagraphBlock => ({
  type: block.type,
  id: block.id,
  children: block.children.map(cloneSpan),
});

// Creates a deep copy of the complete document model.
export const cloneDocument = (documentModel: DocumentModel): DocumentModel => ({
  blocks: documentModel.blocks.map(cloneBlock),
});
