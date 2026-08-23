// Immutable clone helpers for marks, spans, blocks, and full documents.
import type { DocumentModel, InlineMark, ParagraphBlock, TextSpan } from '../../types';

export const cloneMarks = (marks: InlineMark[]): InlineMark[] =>
  marks.map((mark) => (typeof mark === 'string' ? mark : { ...mark }));

export const cloneSpan = (span: TextSpan): TextSpan => ({
  text: span.text,
  marks: cloneMarks(span.marks),
});

export const cloneBlock = (block: ParagraphBlock): ParagraphBlock => ({
  type: block.type,
  id: block.id,
  children: block.children.map(cloneSpan),
});

export const cloneDocument = (documentModel: DocumentModel): DocumentModel => ({
  blocks: documentModel.blocks.map(cloneBlock),
});