import type {
  Block,
  Document,
  InlineMark,
  MarkCoverage,
  SelectionRange,
  TextSpan,
} from './marks.types';
import { cloneDocument, createParagraph, getBlockTextLength, normalizeDocument } from '../document';
import {
  isSelectionCollapsed,
  linearOffsetToSelectionPoint,
  normalizeSelectionRange,
  selectionPointToLinearOffset,
  selectionRangeToLinearRange,
} from '../../editor-core/selection/selection';

const markKey = (mark: InlineMark): string => {
  if (typeof mark === 'string') {
    return mark;
  }

  return `${mark.type}:${mark.href}`;
};

const getBlockStartOffset = (documentModel: Document, blockIndex: number): number => {
  let offset = 0;

  for (let index = 0; index < blockIndex; index += 1) {
    offset += getBlockTextLength(documentModel.blocks[index]);

    if (index < documentModel.blocks.length - 1) {
      offset += 1;
    }
  }

  return offset;
};

const getBlockIndexById = (documentModel: Document, blockId: string): number => {
  const blockIndex = documentModel.blocks.findIndex((block) => block.id === blockId);

  return blockIndex === -1 ? 0 : blockIndex;
};

const cloneMarks = (marks: InlineMark[]): InlineMark[] =>
  marks.map((mark) => (typeof mark === 'string' ? mark : { ...mark }));

const cloneSpan = (span: TextSpan): TextSpan => ({
  text: span.text,
  marks: cloneMarks(span.marks),
});

const cloneBlock = (block: Block): Block => ({
  type: block.type,
  id: block.id,
  children: block.children.map(cloneSpan),
});

export const getMarkCoverage = (
  documentModel: Document,
  selectionRange: SelectionRange,
  mark: InlineMark,
): MarkCoverage => {
  const normalizedSelection = normalizeSelectionRange(documentModel, selectionRange);

  if (isSelectionCollapsed(normalizedSelection)) {
    return 'partial';
  }

  const { start, end } = selectionRangeToLinearRange(documentModel, normalizedSelection);
  let selectedLength = 0;
  let markedLength = 0;

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
        const overlapLength = spanOverlapEnd - spanOverlapStart;
        selectedLength += overlapLength;

        if (span.marks.some((spanMark) => markKey(spanMark) === markKey(mark))) {
          markedLength += overlapLength;
        }
      }

      spanOffset += span.text.length;
    }
  }

  if (selectedLength === 0 || markedLength === 0) {
    return 'absent';
  }

  if (markedLength === selectedLength) {
    return 'present';
  }

  return 'partial';
};

const markExists = (marks: InlineMark[], mark: InlineMark): boolean =>
  marks.some((currentMark) => markKey(currentMark) === markKey(mark));

const addMark = (marks: InlineMark[], mark: InlineMark): InlineMark[] => {
  if (typeof mark === 'string') {
    if (markExists(marks, mark)) {
      return cloneMarks(marks);
    }

    return [...cloneMarks(marks), mark];
  }

  const filteredMarks = marks.filter(
    (currentMark) =>
      currentMark === 'bold' || currentMark === 'italic' || currentMark.type !== 'link',
  );

  if (markExists(filteredMarks, mark)) {
    return cloneMarks(filteredMarks);
  }

  return [...cloneMarks(filteredMarks), { ...mark }];
};

const removeMark = (marks: InlineMark[], mark: InlineMark): InlineMark[] => {
  if (typeof mark === 'string') {
    return marks
      .filter((currentMark) => currentMark !== mark)
      .map((currentMark) => (typeof currentMark === 'string' ? currentMark : { ...currentMark }));
  }

  return marks
    .filter((currentMark) => markKey(currentMark) !== markKey(mark))
    .map((currentMark) => (typeof currentMark === 'string' ? currentMark : { ...currentMark }));
};

const transformBlockRange = (
  block: Block,
  startOffset: number,
  endOffset: number,
  mark: InlineMark,
  mode: 'add' | 'remove',
): Block => {
  let spanOffset = 0;
  const nextChildren: TextSpan[] = [];

  for (const span of block.children) {
    const spanStart = spanOffset;
    const spanEnd = spanOffset + span.text.length;

    if (span.text.length === 0 || spanEnd <= startOffset || spanStart >= endOffset) {
      nextChildren.push(cloneSpan(span));
      spanOffset = spanEnd;
      continue;
    }

    const rangeStart = Math.max(startOffset, spanStart);
    const rangeEnd = Math.min(endOffset, spanEnd);
    const localStart = rangeStart - spanStart;
    const localEnd = rangeEnd - spanStart;

    if (localStart > 0) {
      nextChildren.push({
        text: span.text.slice(0, localStart),
        marks: cloneMarks(span.marks),
      });
    }

    const selectedMarks = mode === 'add' ? addMark(span.marks, mark) : removeMark(span.marks, mark);

    if (localEnd > localStart) {
      nextChildren.push({
        text: span.text.slice(localStart, localEnd),
        marks: selectedMarks,
      });
    }

    if (localEnd < span.text.length) {
      nextChildren.push({
        text: span.text.slice(localEnd),
        marks: cloneMarks(span.marks),
      });
    }

    spanOffset = spanEnd;
  }

  return {
    type: 'paragraph',
    id: block.id,
    children: nextChildren.length > 0 ? nextChildren : [{ text: '', marks: [] }],
  };
};

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

export const toggleInlineMark = (
  documentModel: Document,
  selectionRange: SelectionRange,
  mark: InlineMark,
): Document => {
  const normalizedDocument = normalizeDocument(documentModel);
  const normalizedSelection = normalizeSelectionRange(normalizedDocument, selectionRange);

  if (isSelectionCollapsed(normalizedSelection)) {
    return normalizedDocument;
  }

  const { start, end } = selectionRangeToLinearRange(normalizedDocument, normalizedSelection);
  const mode =
    getMarkCoverage(normalizedDocument, normalizedSelection, mark) === 'present' ? 'remove' : 'add';

  return normalizeDocument({
    blocks: normalizedDocument.blocks.map((block, blockIndex) => {
      const blockStart = getBlockStartOffset(normalizedDocument, blockIndex);
      const blockEnd = blockStart + getBlockTextLength(block);
      const overlapStart = Math.max(start, blockStart);
      const overlapEnd = Math.min(end, blockEnd);

      if (overlapStart >= overlapEnd) {
        return cloneBlock(block);
      }

      return transformBlockRange(
        block,
        overlapStart - blockStart,
        overlapEnd - blockStart,
        mark,
        mode,
      );
    }),
  });
};

export const applyInlineMark = (
  documentModel: Document,
  selectionRange: SelectionRange,
  mark: InlineMark,
): Document => {
  const normalizedDocument = normalizeDocument(documentModel);
  const normalizedSelection = normalizeSelectionRange(normalizedDocument, selectionRange);

  if (isSelectionCollapsed(normalizedSelection)) {
    return normalizedDocument;
  }

  const { start, end } = selectionRangeToLinearRange(normalizedDocument, normalizedSelection);

  return normalizeDocument({
    blocks: normalizedDocument.blocks.map((block, blockIndex) => {
      const blockStart = getBlockStartOffset(normalizedDocument, blockIndex);
      const blockEnd = blockStart + getBlockTextLength(block);
      const overlapStart = Math.max(start, blockStart);
      const overlapEnd = Math.min(end, blockEnd);

      if (overlapStart >= overlapEnd) {
        return cloneBlock(block);
      }

      return transformBlockRange(
        block,
        overlapStart - blockStart,
        overlapEnd - blockStart,
        mark,
        'add',
      );
    }),
  });
};

export const clearInlineMark = (
  documentModel: Document,
  selectionRange: SelectionRange,
  mark: InlineMark,
): Document => {
  const normalizedDocument = normalizeDocument(documentModel);
  const normalizedSelection = normalizeSelectionRange(normalizedDocument, selectionRange);

  if (isSelectionCollapsed(normalizedSelection)) {
    return normalizedDocument;
  }

  const { start, end } = selectionRangeToLinearRange(normalizedDocument, normalizedSelection);

  return normalizeDocument({
    blocks: normalizedDocument.blocks.map((block, blockIndex) => {
      const blockStart = getBlockStartOffset(normalizedDocument, blockIndex);
      const blockEnd = blockStart + getBlockTextLength(block);
      const overlapStart = Math.max(start, blockStart);
      const overlapEnd = Math.min(end, blockEnd);

      if (overlapStart >= overlapEnd) {
        return cloneBlock(block);
      }

      return transformBlockRange(
        block,
        overlapStart - blockStart,
        overlapEnd - blockStart,
        mark,
        'remove',
      );
    }),
  });
};

export const getSelectionMarks = (
  documentModel: Document,
  selectionRange: SelectionRange,
): InlineMark[] => {
  const normalizedSelection = normalizeSelectionRange(documentModel, selectionRange);

  if (isSelectionCollapsed(normalizedSelection)) {
    return [];
  }

  const { start, end } = selectionRangeToLinearRange(documentModel, normalizedSelection);
  const collectedMarks = new Map<string, InlineMark>();

  for (let blockIndex = 0; blockIndex < documentModel.blocks.length; blockIndex += 1) {
    const block = documentModel.blocks[blockIndex];
    const blockStart = getBlockStartOffset(documentModel, blockIndex);
    const blockEnd = blockStart + getBlockTextLength(block);
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
        for (const spanMark of span.marks) {
          collectedMarks.set(markKey(spanMark), spanMark);
        }
      }

      spanOffset += span.text.length;
    }
  }

  return Array.from(collectedMarks.values());
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

  const firstBlockIndex = Math.max(
    0,
    normalizedDocument.blocks.findIndex((block) => block.id === normalizedSelection.anchor.blockId),
  );
  const lastBlockIndex = Math.max(
    firstBlockIndex,
    normalizedDocument.blocks.findIndex((block) => block.id === normalizedSelection.focus.blockId),
  );

  const nextDocument = cloneDocument(normalizedDocument);
  const targetBlock = nextDocument.blocks[firstBlockIndex] ?? createParagraph('block-1');
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
    selection: updateSelectionAfterRangeChange(
      normalizedDocument,
      normalizedSelection,
      text.length,
    ),
  };
};

export const deleteSelectionRange = (
  documentModel: Document,
  selectionRange: SelectionRange,
): { document: Document; selection: SelectionRange } =>
  replaceSelectionWithText(documentModel, selectionRange, '', []);

export const getActiveMarks = getSelectionMarks;
export const toggleMark = toggleInlineMark;
