import { useRef } from 'react';
import type { Block as BlockModel } from '../../model';
import type { EditorSelection } from '../../editor-core/selection';
import { useEditorContext, useRestoreEditorSelection } from '../../hooks';

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

/** Converts block text runs into escaped HTML with their inline formatting. */
const renderBlockHtml = (block: BlockModel): string =>
  block.children
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

/** Renders one editable block and synchronizes its DOM selection with the model. */
export default function Block({ block }: BlockProps) {
  const { selection, applyInput, setSelection, insertNewline, insertText } = useEditorContext();
  const blockRef = useRef<HTMLDivElement>(null);
  const text = block.children.map((run) => run.text).join('');

  const renderedHtml = renderBlockHtml(block);

  useRestoreEditorSelection(blockRef, block.id, selection, text.length);

  /** Stores the browser selection in model coordinates. */
  const handleSelect = (event: React.SyntheticEvent<HTMLDivElement>) => {
    const nextSelection = getModelSelection(event.currentTarget, block.id);

    if (nextSelection) {
      setSelection(nextSelection);
    }
  };

  /** Inserts a newline or space when the corresponding key is pressed. */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      document.getElementById('editor-bold-button')?.focus();
      return;
    }

    const isSpaceKey = event.key === ' ' || event.key === 'Spacebar' || event.code === 'Space';

    if (event.key !== 'Enter' && !isSpaceKey) {
      return;
    }

    const currentSelection = getModelSelection(event.currentTarget, block.id) ?? selection;

    event.preventDefault();

    if (event.key === 'Enter') {
      insertNewline(currentSelection);
      return;
    }

    insertText(' ', currentSelection);
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
