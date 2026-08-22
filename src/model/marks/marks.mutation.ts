// Internal mark mutation pipeline used by toggle/apply/clear actions.
import type { Block, Document, InlineMark, SelectionRange, TextSpan } from '../types';
import { getBlockTextLength, normalizeDocument } from '../document';
import { isSelectionCollapsed, normalizeSelectionRange, selectionRangeToLinearRange } from '../../editor-core/selection/selection';
import { MarkMutationMode, cloneBlock, cloneMarks, cloneSpan, getBlockStartOffset, markKey } from './marks.shared';

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
  mode: MarkMutationMode,
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

export const applyMarkMutation = (
  documentModel: Document,
  selectionRange: SelectionRange,
  mark: InlineMark,
  mode: MarkMutationMode,
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

      return transformBlockRange(block, overlapStart - blockStart, overlapEnd - blockStart, mark, mode);
    }),
  });
};