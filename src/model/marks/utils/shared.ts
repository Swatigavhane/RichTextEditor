// Shared traversal and cloning helpers for mark-related operations.
import type { Block, Document, InlineMark, SelectionRange, TextSpan } from '../../types';
import { BLOCK_SEPARATOR_LENGTH } from '../../constants';
import { getBlockTextLength } from '../../document';
import { normalizeSelectionRange, selectionRangeToLinearRange } from '../../../editor-core/selection/selection';

export type MarkMutationMode = 'add' | 'remove';
export type SpanVisitor = (span: TextSpan, overlapLength: number) => void;

export const markKey = (mark: InlineMark): string =>
  typeof mark === 'string' ? mark : `${mark.type}:${mark.href}`;

export const getBlockStartOffset = (documentModel: Document, blockIndex: number): number => {
  let offset = 0;

  for (let index = 0; index < blockIndex; index += 1) {
    offset += getBlockTextLength(documentModel.blocks[index]);

    if (index < documentModel.blocks.length - 1) {
      offset += BLOCK_SEPARATOR_LENGTH;
    }
  }

  return offset;
};

export const findBlockIndexById = (documentModel: Document, blockId: string): number => {
  const index = documentModel.blocks.findIndex((block) => block.id === blockId);

  return index === -1 ? 0 : index;
};

export const cloneMarks = (marks: InlineMark[]): InlineMark[] =>
  marks.map((mark) => (typeof mark === 'string' ? mark : { ...mark }));

export const cloneSpan = (span: TextSpan): TextSpan => ({
  text: span.text,
  marks: cloneMarks(span.marks),
});

export const cloneBlock = (block: Block): Block => ({
  type: block.type,
  id: block.id,
  children: block.children.map(cloneSpan),
});

export const getLinearSelectionBounds = (documentModel: Document, selectionRange: SelectionRange) => {
  const normalizedSelection = normalizeSelectionRange(documentModel, selectionRange);
  const linearRange = selectionRangeToLinearRange(documentModel, normalizedSelection);

  return {
    selection: normalizedSelection,
    start: linearRange.start,
    end: linearRange.end,
  };
};

export const forEachSelectedSpan = (
  documentModel: Document,
  start: number,
  end: number,
  visitSpan: SpanVisitor,
) => {
  for (let blockIndex = 0; blockIndex < documentModel.blocks.length; blockIndex += 1) {
    const block = documentModel.blocks[blockIndex];
    const blockStart = getBlockStartOffset(documentModel, blockIndex);
    const blockLength = getBlockTextLength(block);
    const blockEnd = blockStart + blockLength;
    const overlapStart = Math.max(start, blockStart);
    const overlapEnd = Math.min(end, blockEnd);

    if (overlapStart >= overlapEnd) {
      continue;
    }

    let spanOffset = 0;

    for (const span of block.children) {
      const spanStart = blockStart + spanOffset;
      const spanEnd = spanStart + span.text.length;
      const spanOverlapStart = Math.max(overlapStart, spanStart);
      const spanOverlapEnd = Math.min(overlapEnd, spanEnd);

      if (spanOverlapStart < spanOverlapEnd) {
        visitSpan(span, spanOverlapEnd - spanOverlapStart);
      }

      spanOffset += span.text.length;
    }
  }
};