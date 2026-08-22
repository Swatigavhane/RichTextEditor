// Text replacement helpers that update document content and resulting selection.
import type { Block, Document, InlineMark, SelectionRange, TextSpan } from '../types';
import { cloneDocument, createParagraph, getBlockTextLength, normalizeDocument } from '../document';
import { linearOffsetToSelectionPoint, normalizeSelectionRange, selectionRangeToLinearRange } from '../../editor-core/selection/selection';
import { cloneBlock, cloneMarks, findBlockIndexById, getBlockStartOffset } from './marks.shared';

const DEFAULT_BLOCK_ID = 'block-1';

const updateSelectionAfterRangeChange = (
  documentModel: Document,
  selectionRange: SelectionRange,
  replacementLength: number,
): SelectionRange => {
  const { start } = selectionRangeToLinearRange(documentModel, selectionRange);
  const replacementEnd = start + replacementLength;

  return {
    anchor: linearOffsetToSelectionPoint(documentModel, replacementEnd),
    focus: linearOffsetToSelectionPoint(documentModel, replacementEnd),
  };
};

export const replaceSelectionWithText = (
  documentModel: Document,
  selectionRange: SelectionRange,
  text: string,
  marks: InlineMark[] = [],
): { document: Document; selection: SelectionRange } => {
  const normalizedDocument = normalizeDocument(documentModel);
  const normalizedSelection = normalizeSelectionRange(normalizedDocument, selectionRange);
  const { start, end } = selectionRangeToLinearRange(normalizedDocument, normalizedSelection);

  if (start === end && text.length === 0) {
    return {
      document: normalizedDocument,
      selection: normalizedSelection,
    };
  }

  const firstBlockIndex = findBlockIndexById(normalizedDocument, normalizedSelection.anchor.blockId);
  const lastBlockIndex = Math.max(
    firstBlockIndex,
    findBlockIndexById(normalizedDocument, normalizedSelection.focus.blockId),
  );

  const nextDocument = cloneDocument(normalizedDocument);
  const targetBlock = nextDocument.blocks[firstBlockIndex] ?? createParagraph(DEFAULT_BLOCK_ID);
  const blockStart = getBlockStartOffset(normalizedDocument, firstBlockIndex);
  const blockEnd = blockStart + getBlockTextLength(targetBlock);
  const localStart = Math.max(0, start - blockStart);
  const localEnd = Math.min(blockEnd - blockStart, end - blockStart);
  const nextChildren: TextSpan[] = [];
  let spanOffset = 0;

  for (const span of targetBlock.children) {
    const spanStart = spanOffset;
    const spanEnd = spanOffset + span.text.length;

    if (spanEnd <= localStart || spanStart >= localEnd) {
      nextChildren.push({ text: span.text, marks: [...span.marks] });
      spanOffset = spanEnd;
      continue;
    }

    if (spanStart < localStart) {
      nextChildren.push({
        text: span.text.slice(0, localStart - spanStart),
        marks: cloneMarks(span.marks),
      });
    }

    if (text.length > 0) {
      nextChildren.push({
        text,
        marks: cloneMarks(marks),
      });
    }

    if (spanEnd > localEnd) {
      nextChildren.push({
        text: span.text.slice(localEnd - spanStart),
        marks: cloneMarks(span.marks),
      });
    }

    spanOffset = spanEnd;
  }

  const updatedBlock: Block = {
    type: 'paragraph',
    id: targetBlock.id,
    children: nextChildren,
  };

  nextDocument.blocks[firstBlockIndex] = updatedBlock;

  for (let index = firstBlockIndex + 1; index <= lastBlockIndex; index += 1) {
    nextDocument.blocks[index] = cloneBlock(normalizedDocument.blocks[index]);
  }

  return {
    document: normalizeDocument(nextDocument),
    selection: updateSelectionAfterRangeChange(normalizedDocument, normalizedSelection, text.length),
  };
};

export const deleteSelectionRange = (
  documentModel: Document,
  selectionRange: SelectionRange,
): { document: Document; selection: SelectionRange } =>
  replaceSelectionWithText(documentModel, selectionRange, '', []);