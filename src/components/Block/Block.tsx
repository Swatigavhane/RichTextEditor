import { useLayoutEffect, useRef } from 'react';
import type { Block as BlockModel } from '../../model';
import { useEditorContext } from '../../hooks';

type BlockProps = {
  block: BlockModel;
};

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

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export default function Block({ block }: BlockProps) {
  const { selection, applyInput, setSelection } = useEditorContext();
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

  const handleSelect = (event: React.SyntheticEvent<HTMLDivElement>) => {
    const domSelection = getValidDomSelection(window.getSelection());

    if (!domSelection) {
      return;
    }

    const range = domSelection.getRangeAt(0);

    if (!event.currentTarget.contains(range.commonAncestorContainer)) {
      return;
    }

    setSelection({
      anchor: {
        blockId: block.id,
        offset: getTextOffset(
          event.currentTarget,
          domSelection.anchorNode,
          domSelection.anchorOffset,
        ),
      },
      focus: {
        blockId: block.id,
        offset: getTextOffset(
          event.currentTarget,
          domSelection.focusNode,
          domSelection.focusOffset,
        ),
      },
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      event.key !== 'Enter' ||
      selection.anchor.blockId !== block.id ||
      selection.focus.blockId !== block.id ||
      selection.anchor.offset !== selection.focus.offset
    ) {
      return;
    }

    event.preventDefault();
    const start = Math.min(selection.anchor.offset, selection.focus.offset);
    const end = Math.max(selection.anchor.offset, selection.focus.offset);
    const nextText = `${text.slice(0, start)}\n${text.slice(end)}`;

    applyInput(text, nextText, selection);
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
      onInput={(event) => applyInput(text, event.currentTarget.textContent ?? '', selection)}
      onSelect={handleSelect}
      onKeyDown={handleKeyDown}
    />
  );
}
