export type InlineMarkType = 'bold' | 'italic';

export interface LinkMark {
  type: 'link';
  href: string;
}

export type InlineMark = InlineMarkType | LinkMark;

export interface TextSpan {
  text: string;
  marks: InlineMark[];
}

export interface ParagraphBlock {
  type: 'paragraph';
  id: string;
  children: TextSpan[];
}

export type Block = ParagraphBlock;

export interface DocumentModel {
  blocks: Block[];
}

export interface SelectionPoint {
  blockId: string;
  offset: number;
}

export interface SelectionRange {
  anchor: SelectionPoint;
  focus: SelectionPoint;
}

export interface LinearSelectionRange {
  anchor: number;
  focus: number;
  start: number;
  end: number;
  isBackward: boolean;
}

export type MarkCoverage = 'absent' | 'partial' | 'present';

const EMPTY_SPAN: TextSpan = { text: '', marks: [] };

const cloneMarks = (marks: InlineMark[]): InlineMark[] =>
  marks.map((mark) => (typeof mark === 'string' ? mark : { ...mark }));

const cloneSpan = (span: TextSpan): TextSpan => ({
  text: span.text,
  marks: cloneMarks(span.marks),
});

const cloneBlock = (block: ParagraphBlock): ParagraphBlock => ({
  type: block.type,
  id: block.id,
  children: block.children.map(cloneSpan),
});

const cloneDocument = (documentModel: DocumentModel): DocumentModel => ({
  blocks: documentModel.blocks.map(cloneBlock),
});

export const createParagraph = (id: string, text = ''): ParagraphBlock => ({
  type: 'paragraph',
  id,
  children: text.length > 0 ? [{ text, marks: [] }] : [EMPTY_SPAN],
});

export const createEmptyDocument = (): DocumentModel => ({
  blocks: [createParagraph('block-1')],
});

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isInlineMarkType = (value: unknown): value is InlineMarkType =>
  value === 'bold' || value === 'italic';

const isLinkMark = (value: unknown): value is LinkMark =>
  isObject(value) && value.type === 'link' && typeof value.href === 'string';

const isInlineMark = (value: unknown): value is InlineMark =>
  isInlineMarkType(value) || isLinkMark(value);

const isTextSpan = (value: unknown): value is TextSpan =>
  isObject(value) &&
  typeof value.text === 'string' &&
  Array.isArray(value.marks) &&
  value.marks.every(isInlineMark);

const isParagraphBlock = (value: unknown): value is ParagraphBlock =>
  isObject(value) &&
  value.type === 'paragraph' &&
  typeof value.id === 'string' &&
  Array.isArray(value.children) &&
  value.children.every(isTextSpan);

const isDocumentModel = (value: unknown): value is DocumentModel =>
  isObject(value) && Array.isArray(value.blocks) && value.blocks.every(isParagraphBlock);

const markKey = (mark: InlineMark): string => {
  if (typeof mark === 'string') {
    return mark;
  }

  return `${mark.type}:${mark.href}`;
};

const marksAreEqual = (left: InlineMark[], right: InlineMark[]): boolean =>
  left.length === right.length &&
  left.every((mark, index) => markKey(mark) === markKey(right[index]));

const spansAreMergeable = (left: TextSpan, right: TextSpan): boolean =>
  left.text.length > 0 && right.text.length > 0 && marksAreEqual(left.marks, right.marks);

const normalizeSpans = (spans: TextSpan[]): TextSpan[] => {
  const normalizedSpans: TextSpan[] = [];

  for (const span of spans) {
    if (span.text.length === 0) {
      continue;
    }

    const previousSpan = normalizedSpans[normalizedSpans.length - 1];

    if (previousSpan && spansAreMergeable(previousSpan, span)) {
      previousSpan.text += span.text;
      continue;
    }

    normalizedSpans.push(cloneSpan(span));
  }

  return normalizedSpans.length > 0 ? normalizedSpans : [EMPTY_SPAN];
};

const normalizeBlock = (block: ParagraphBlock): ParagraphBlock => ({
  type: 'paragraph',
  id: block.id,
  children: normalizeSpans(block.children),
});

export const normalizeDocument = (documentModel: DocumentModel): DocumentModel => ({
  blocks:
    documentModel.blocks.length > 0
      ? documentModel.blocks.map(normalizeBlock)
      : [createParagraph('block-1')],
});

export const serializeDocument = (documentModel: DocumentModel): string =>
  JSON.stringify(normalizeDocument(documentModel));

export const deserializeDocument = (serializedDocument: string): DocumentModel => {
  const parsedDocument = JSON.parse(serializedDocument) as unknown;

  if (!isDocumentModel(parsedDocument)) {
    throw new Error('Invalid document model');
  }

  return normalizeDocument(parsedDocument);
};

export const getBlockTextLength = (block: ParagraphBlock): number =>
  block.children.reduce((length, span) => length + span.text.length, 0);

export const getDocumentText = (documentModel: DocumentModel): string =>
  documentModel.blocks.map((block) => block.children.map((span) => span.text).join('')).join('\n');

const getBlockStartOffset = (documentModel: DocumentModel, blockIndex: number): number => {
  let offset = 0;

  for (let index = 0; index < blockIndex; index += 1) {
    offset += getBlockTextLength(documentModel.blocks[index]);

    if (index < documentModel.blocks.length - 1) {
      offset += 1;
    }
  }

  return offset;
};

const getBlockIndexById = (documentModel: DocumentModel, blockId: string): number => {
  const blockIndex = documentModel.blocks.findIndex((block) => block.id === blockId);

  if (blockIndex === -1) {
    return 0;
  }

  return blockIndex;
};

const clampOffset = (offset: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(offset, minimum), maximum);

export const clampSelectionPoint = (
  documentModel: DocumentModel,
  point: SelectionPoint,
): SelectionPoint => {
  const blockIndex = getBlockIndexById(documentModel, point.blockId);
  const block = documentModel.blocks[blockIndex] ?? createParagraph('block-1');
  const blockLength = getBlockTextLength(block);

  return {
    blockId: block.id,
    offset: clampOffset(point.offset, 0, blockLength),
  };
};

export const normalizeSelectionRange = (
  documentModel: DocumentModel,
  selectionRange: SelectionRange,
): SelectionRange => ({
  anchor: clampSelectionPoint(documentModel, selectionRange.anchor),
  focus: clampSelectionPoint(documentModel, selectionRange.focus),
});

export const isSelectionCollapsed = (selectionRange: SelectionRange): boolean =>
  selectionRange.anchor.blockId === selectionRange.focus.blockId &&
  selectionRange.anchor.offset === selectionRange.focus.offset;

export const selectionPointToLinearOffset = (
  documentModel: DocumentModel,
  point: SelectionPoint,
): number => {
  const normalizedPoint = clampSelectionPoint(documentModel, point);
  const blockIndex = getBlockIndexById(documentModel, normalizedPoint.blockId);
  const block = documentModel.blocks[blockIndex] ?? createParagraph('block-1');

  return (
    getBlockStartOffset(documentModel, blockIndex) +
    clampOffset(normalizedPoint.offset, 0, getBlockTextLength(block))
  );
};

export const selectionRangeToLinearRange = (
  documentModel: DocumentModel,
  selectionRange: SelectionRange,
): LinearSelectionRange => {
  const normalizedSelection = normalizeSelectionRange(documentModel, selectionRange);
  const anchor = selectionPointToLinearOffset(documentModel, normalizedSelection.anchor);
  const focus = selectionPointToLinearOffset(documentModel, normalizedSelection.focus);

  return {
    anchor,
    focus,
    start: Math.min(anchor, focus),
    end: Math.max(anchor, focus),
    isBackward: anchor > focus,
  };
};

export const linearOffsetToSelectionPoint = (
  documentModel: DocumentModel,
  linearOffset: number,
): SelectionPoint => {
  const totalLength = getDocumentText(documentModel).length;
  let remainingOffset = clampOffset(linearOffset, 0, totalLength);

  for (let blockIndex = 0; blockIndex < documentModel.blocks.length; blockIndex += 1) {
    const block = documentModel.blocks[blockIndex];
    const blockLength = getBlockTextLength(block);

    if (remainingOffset <= blockLength || blockIndex === documentModel.blocks.length - 1) {
      return {
        blockId: block.id,
        offset: clampOffset(remainingOffset, 0, blockLength),
      };
    }

    remainingOffset -= blockLength + 1;
  }

  const lastBlock =
    documentModel.blocks[documentModel.blocks.length - 1] ?? createParagraph('block-1');

  return {
    blockId: lastBlock.id,
    offset: getBlockTextLength(lastBlock),
  };
};

export const linearRangeToSelectionRange = (
  documentModel: DocumentModel,
  linearRange: { start: number; end: number; isBackward?: boolean },
): SelectionRange => {
  const anchor = linearOffsetToSelectionPoint(
    documentModel,
    linearRange.isBackward ? linearRange.end : linearRange.start,
  );
  const focus = linearOffsetToSelectionPoint(
    documentModel,
    linearRange.isBackward ? linearRange.start : linearRange.end,
  );

  return {
    anchor,
    focus,
  };
};

const getMarksAtOffset = (documentModel: DocumentModel, linearOffset: number): InlineMark[] => {
  const selectionPoint = linearOffsetToSelectionPoint(documentModel, linearOffset);
  const blockIndex = getBlockIndexById(documentModel, selectionPoint.blockId);
  const block = documentModel.blocks[blockIndex];
  let runningOffset = 0;

  for (const span of block.children) {
    const spanEnd = runningOffset + span.text.length;

    if (selectionPoint.offset <= spanEnd) {
      return cloneMarks(span.marks);
    }

    runningOffset = spanEnd;
  }

  return [];
};

export const getMarkCoverage = (
  documentModel: DocumentModel,
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
  block: ParagraphBlock,
  startOffset: number,
  endOffset: number,
  mark: InlineMark,
  mode: 'add' | 'remove',
): ParagraphBlock => {
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

  return normalizeBlock({
    type: 'paragraph',
    id: block.id,
    children: nextChildren,
  });
};

const updateSelectionAfterRangeChange = (
  documentModel: DocumentModel,
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
  documentModel: DocumentModel,
  selectionRange: SelectionRange,
  mark: InlineMark,
): DocumentModel => {
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
  documentModel: DocumentModel,
  selectionRange: SelectionRange,
  mark: InlineMark,
): DocumentModel => {
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
  documentModel: DocumentModel,
  selectionRange: SelectionRange,
  mark: InlineMark,
): DocumentModel => {
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
  documentModel: DocumentModel,
  selectionRange: SelectionRange,
): InlineMark[] => {
  const normalizedSelection = normalizeSelectionRange(documentModel, selectionRange);

  if (isSelectionCollapsed(normalizedSelection)) {
    return getMarksAtOffset(
      documentModel,
      selectionPointToLinearOffset(documentModel, normalizedSelection.anchor),
    );
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
        for (const mark of span.marks) {
          collectedMarks.set(markKey(mark), mark);
        }
      }

      spanOffset += span.text.length;
    }
  }

  return Array.from(collectedMarks.values());
};

export const replaceSelectionWithText = (
  documentModel: DocumentModel,
  selectionRange: SelectionRange,
  text: string,
  marks: InlineMark[] = [],
): { document: DocumentModel; selection: SelectionRange } => {
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
      nextChildren.push(cloneSpan(span));
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

  const updatedBlock = normalizeBlock({
    type: 'paragraph',
    id: targetBlock.id,
    children: nextChildren,
  });

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
  documentModel: DocumentModel,
  selectionRange: SelectionRange,
): { document: DocumentModel; selection: SelectionRange } =>
  replaceSelectionWithText(documentModel, selectionRange, '', []);

export type Mark = InlineMark;
export type TextRun = TextSpan;
export type Document = DocumentModel;
export const toggleMark = toggleInlineMark;
