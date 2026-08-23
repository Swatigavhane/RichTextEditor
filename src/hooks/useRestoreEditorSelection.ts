import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';
import type { EditorSelection } from '../editor-core/selection';

/** Finds the DOM node and local offset matching a model text offset. */
const getDomPoint = (root: Node, offset: number): { node: Node; offset: number } => {
  let remainingOffset = offset;

  for (const child of root.childNodes) {
    const childLength = child.textContent?.length ?? 0;

    if (child.nodeType === Node.TEXT_NODE) {
      if (remainingOffset <= childLength) {
        return { node: child, offset: remainingOffset };
      }
    } else if (remainingOffset <= childLength) {
      return getDomPoint(child, remainingOffset);
    }

    remainingOffset -= childLength;
  }

  return { node: root, offset: root.childNodes.length };
};

/** Restores a model selection in the focused editable element after it rerenders. */
export const useRestoreEditorSelection = (
  elementRef: RefObject<HTMLDivElement | null>,
  blockId: string,
  selection: EditorSelection,
  textLength: number,
): void => {
  useLayoutEffect(() => {
    const element = elementRef.current;

    if (
      !element ||
      document.activeElement !== element ||
      selection.anchor.blockId !== blockId ||
      selection.focus.blockId !== blockId
    ) {
      return;
    }

    const domSelection = window.getSelection();
    const range = document.createRange();
    const anchorPoint = getDomPoint(element, Math.min(selection.anchor.offset, textLength));
    const focusPoint = getDomPoint(element, Math.min(selection.focus.offset, textLength));

    range.setStart(anchorPoint.node, anchorPoint.offset);
    range.setEnd(focusPoint.node, focusPoint.offset);

    domSelection?.removeAllRanges();
    domSelection?.addRange(range);
  }, [blockId, elementRef, selection, textLength]);
};
