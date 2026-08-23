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

  return domSelection as (Selection & { anchorNode: Node; focusNode: Node });
};

export default function Block({ block }: BlockProps) {
  const { selection, applyInput, setSelection, splitBlockAt } = useEditorContext();
  const blockRef = useRef<HTMLDivElement>(null);
  const text = block.children.map((run) => run.text).join('');

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
    const textNode = element.firstChild;
    const anchorOffset = Math.min(selection.anchor.offset, text.length);
    const focusOffset = Math.min(selection.focus.offset, text.length);

    if (textNode) {
      range.setStart(textNode, anchorOffset);
      range.setEnd(textNode, focusOffset);
    } else {
      range.setStart(element, 0);
      range.setEnd(element, 0);
    }

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
        offset: getTextOffset(event.currentTarget, domSelection.anchorNode, domSelection.anchorOffset),
      },
      focus: {
        blockId: block.id,
        offset: getTextOffset(event.currentTarget, domSelection.focusNode, domSelection.focusOffset),
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
    splitBlockAt(block.id, selection.anchor.offset);
  };

  return (
    <div
      ref={blockRef}
      className="editor-block"
      contentEditable
      role="textbox"
      aria-label="Editor text"
      suppressContentEditableWarning
      onInput={(event) =>
        applyInput(
          text,
          event.currentTarget.textContent ?? '',
          selection,
        )
      }
      onSelect={handleSelect}
      onKeyDown={handleKeyDown}
    >
      {text}
    </div>
  );
}
