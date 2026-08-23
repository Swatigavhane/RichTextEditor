import { useLayoutEffect, useRef } from 'react';
import type { Block as BlockModel } from '../../model';
import type { EditorSelection } from '../../editor-core/selection';
import { useEditorContext } from '../../hooks';

type BlockProps = {
  block: BlockModel;
};

/** Converts a DOM boundary position into a text offset relative to the block. */
const getTextOffset = (root: Node, target: Node, targetOffset: number): number => {
  if (root === target) {
    if (target.nodeType === Node.TEXT_NODE) {
      return targetOffset;
    }

    return Array.from(target.childNodes)
      .slice(0, targetOffset)
      .reduce((length, child) => length + (child.textContent?.length ?? 0), 0);
  }

  let offset = 0;

  for (const child of root.childNodes) {
    if (child === target || child.contains(target)) {
      return offset + getTextOffset(child, target, targetOffset);
    }

    offset += child.textContent?.length ?? 0;
  }

  return offset;
};

/** Returns the DOM selection only when both endpoints are available. */
const getValidDomSelection = (
  domSelection: Selection | null,
): (Selection & { anchorNode: Node; focusNode: Node }) | null => {
  if (!domSelection || domSelection.rangeCount === 0) {
    return null;
  }

  if (!domSelection.anchorNode || !domSelection.focusNode) {
    return null;
  }

  return domSelection as Selection & { anchorNode: Node; focusNode: Node };
};

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

/** Converts a DOM selection inside a block into model selection offsets. */
const getModelSelection = (element: HTMLDivElement, blockId: string): EditorSelection | null => {
  const domSelection = getValidDomSelection(window.getSelection());

  if (!domSelection) {
    return null;
  }

  const range = domSelection.getRangeAt(0);

  if (!element.contains(range.commonAncestorContainer)) {
    return null;
  }

  return {
    anchor: {
      blockId,
      offset: getTextOffset(element, domSelection.anchorNode, domSelection.anchorOffset),
    },
    focus: {
      blockId,
      offset: getTextOffset(element, domSelection.focusNode, domSelection.focusOffset),
    },
  };
};

/** Escapes text before it is inserted into the block's rendered HTML. */
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Renders one editable block and synchronizes its DOM selection with the model. */
export default function Block({ block }: BlockProps) {
  const { selection, applyInput, setSelection, insertNewline } = useEditorContext();
  const blockRef = useRef<HTMLDivElement>(null);
  const text = block.children.map((run) => run.text).join('');

  const renderedHtml = block.children
    .map((run) => {
      const hasBold = run.marks.includes('bold');
      const hasItalic = run.marks.includes('italic');
      const linkMark = run.marks.find(
        (mark): mark is { type: 'link'; href: string } =>
          typeof mark !== 'string' && mark.type === 'link',
      );

      const styles = [
        hasBold ? 'font-weight:700' : '',
        hasItalic ? 'font-style:italic' : '',
        linkMark ? 'color:#ffbb8a' : '',
        linkMark ? 'text-decoration:underline' : '',
      ].filter(Boolean);

      return styles.length > 0
        ? `<span style="${styles.join(';')}">${escapeHtml(run.text)}</span>`
        : escapeHtml(run.text);
    })
    .join('');

  /** Restores the model selection after React updates the editable DOM. */
  useLayoutEffect(() => {
    const element = blockRef.current;

    if (
      !element ||
      document.activeElement !== element ||
      selection.anchor.blockId !== block.id ||
      selection.focus.blockId !== block.id
    ) {
      return;
    }

    const domSelection = window.getSelection();
    const range = document.createRange();
    const anchorOffset = Math.min(selection.anchor.offset, text.length);
    const focusOffset = Math.min(selection.focus.offset, text.length);
    const anchorPoint = getDomPoint(element, anchorOffset);
    const focusPoint = getDomPoint(element, focusOffset);

    range.setStart(anchorPoint.node, anchorPoint.offset);
    range.setEnd(focusPoint.node, focusPoint.offset);

    domSelection?.removeAllRanges();
    domSelection?.addRange(range);
  }, [block.id, selection, text]);

  /** Stores the browser selection in model coordinates. */
  const handleSelect = (event: React.SyntheticEvent<HTMLDivElement>) => {
    const nextSelection = getModelSelection(event.currentTarget, block.id);

    if (nextSelection) {
      setSelection(nextSelection);
    }
  };

  /** Inserts a newline when Enter is pressed inside the block. */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter') {
      return;
    }

    const currentSelection = getModelSelection(event.currentTarget, block.id) ?? selection;

    event.preventDefault();
    insertNewline(currentSelection);
  };

  return (
    <div
      ref={blockRef}
      className="editor-block"
      contentEditable
      role="textbox"
      aria-label="Editor text"
      suppressContentEditableWarning
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
      onInput={(event) =>
        applyInput(
          text,
          event.currentTarget.textContent ?? '',
          getModelSelection(event.currentTarget, block.id) ?? selection,
        )
      }
      onSelect={handleSelect}
      onKeyDown={handleKeyDown}
    />
  );
}
