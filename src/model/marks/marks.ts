// Public marks API: coverage checks, mark toggles, and selection helpers.
import type { Document, InlineMark, MarkCoverage, SelectionRange } from '../types';
import { normalizeDocument } from '../document';
import {
  isSelectionCollapsed,
  normalizeSelectionRange,
} from '../../editor-core/selection/selection';
import { applyMarkMutation } from './operations/mutation';
import { forEachSelectedSpan, getLinearSelectionBounds, markKey } from './utils/shared';
export { deleteSelectionRange, replaceSelectionWithText } from './operations/replace';

// Reports whether the selected text contains none, some, or all of a mark.
export const getMarkCoverage = (
  documentModel: Document,
  selectionRange: SelectionRange,
  mark: InlineMark,
): MarkCoverage => {
  const { selection, start, end } = getLinearSelectionBounds(documentModel, selectionRange);

  if (isSelectionCollapsed(selection)) {
    return 'partial';
  }

  let selectedLength = 0;
  let markedLength = 0;

  forEachSelectedSpan(documentModel, start, end, (span, overlapLength) => {
    selectedLength += overlapLength;

    if (span.marks.some((spanMark) => markKey(spanMark) === markKey(mark))) {
      markedLength += overlapLength;
    }
  });

  if (selectedLength === 0 || markedLength === 0) {
    return 'absent';
  }

  if (markedLength === selectedLength) {
    return 'present';
  }

  return 'partial';
};

// Toggles a mark across the selected text based on its current coverage.
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

  const mode =
    getMarkCoverage(normalizedDocument, normalizedSelection, mark) === 'present' ? 'remove' : 'add';

  return applyMarkMutation(normalizedDocument, normalizedSelection, mark, mode);
};

/** Applies a mark to every text range covered by the selection. */
export const applyInlineMark = (
  documentModel: Document,
  selectionRange: SelectionRange,
  mark: InlineMark,
): Document => applyMarkMutation(documentModel, selectionRange, mark, 'add');

// Removes a mark from the selected text.
export const clearInlineMark = (
  documentModel: Document,
  selectionRange: SelectionRange,
  mark: InlineMark,
): Document => applyMarkMutation(documentModel, selectionRange, mark, 'remove');

/** Returns the distinct marks present in the selected text. */
export const getSelectionMarks = (
  documentModel: Document,
  selectionRange: SelectionRange,
): InlineMark[] => {
  const { selection, start, end } = getLinearSelectionBounds(documentModel, selectionRange);

  if (isSelectionCollapsed(selection)) {
    return [];
  }

  const collectedMarks = new Map<string, InlineMark>();

  forEachSelectedSpan(documentModel, start, end, (span) => {
    for (const spanMark of span.marks) {
      collectedMarks.set(markKey(spanMark), spanMark);
    }
  });

  return Array.from(collectedMarks.values());
};
