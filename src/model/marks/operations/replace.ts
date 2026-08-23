// Text replacement helpers that update document content and resulting selection.
import type { Block, Document, InlineMark, SelectionRange, TextSpan } from '../../types';
import { DEFAULT_BLOCK_ID } from '../../constants';
import {
  cloneDocument,
  createParagraph,
  getBlockTextLength,
  normalizeDocument,
} from '../../document';
import {
  linearOffsetToSelectionPoint,
  normalizeSelectionRange,
  selectionRangeToLinearRange,
} from '../../../editor-core/selection/selection';
import { cloneBlock, cloneMarks, findBlockIndexById, getBlockStartOffset } from '../utils/shared';

// Calculates the collapsed caret after replacing a selected range.
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

// Replaces the selected range with text and returns the updated document and caret.
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

  const firstBlockIndex = findBlockIndexById(
    normalizedDocument,
    normalizedSelection.anchor.blockId,
  );
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
  const isCollapsedRange = localStart === localEnd;
  const nextChildren: TextSpan[] = [];
  let replacementInserted = false;
  let spanOffset = 0;

  for (const span of targetBlock.children) {
    const spanStart = spanOffset;
    const spanEnd = spanOffset + span.text.length;

    if (
      isCollapsedRange &&
      text.length > 0 &&
      !replacementInserted &&
      localStart >= spanStart &&
      localStart <= spanEnd
    ) {
      const localCaretOffset = localStart - spanStart;

      if (localCaretOffset === 0) {
        nextChildren.push({
          text,
          marks: cloneMarks(marks),
        });
        nextChildren.push({ text: span.text, marks: cloneMarks(span.marks) });
      } else if (localCaretOffset === span.text.length) {
        nextChildren.push({ text: span.text, marks: cloneMarks(span.marks) });
        nextChildren.push({
          text,
          marks: cloneMarks(marks),
        });
      } else {
        nextChildren.push({
          text: span.text.slice(0, localCaretOffset),
          marks: cloneMarks(span.marks),
        });
        nextChildren.push({
          text,
          marks: cloneMarks(marks),
        });
        nextChildren.push({
          text: span.text.slice(localCaretOffset),
          marks: cloneMarks(span.marks),
        });
      }

      replacementInserted = true;
      spanOffset = spanEnd;
      continue;
    }

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

    if (text.length > 0 && !replacementInserted) {
      nextChildren.push({
        text,
        marks: cloneMarks(marks),
      });
      replacementInserted = true;
    }

    if (spanEnd > localEnd) {
      nextChildren.push({
        text: span.text.slice(localEnd - spanStart),
        marks: cloneMarks(span.marks),
      });
    }

    spanOffset = spanEnd;
  }

  if (text.length > 0 && !replacementInserted) {
    nextChildren.push({
      text,
      marks: cloneMarks(marks),
    });
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

  const normalizedNextDocument = normalizeDocument(nextDocument);

  return {
    document: normalizedNextDocument,
    selection: updateSelectionAfterRangeChange(
      normalizedNextDocument,
      normalizedSelection,
      text.length,
    ),
  };
};
