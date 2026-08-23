import type { Document } from '../../model/types';
import { getBlockTextLength, getDocumentText, createParagraph } from '../../model/document';
import { BLOCK_SEPARATOR_LENGTH, DEFAULT_BLOCK_ID } from '../../model/constants';
import type { EditorSelection, LinearSelection, SelectionPoint } from './types';

const clampOffset = (offset: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(offset, minimum), maximum);

const getBlockOrDefault = (documentModel: Document, blockIndex: number) =>
  documentModel.blocks[blockIndex] ?? createParagraph(DEFAULT_BLOCK_ID);

const getBlockStartOffset = (documentModel: Document, blockIndex: number): number => {
  let offset = 0;
  const lastIndex = documentModel.blocks.length - 1;

  for (let index = 0; index < blockIndex; index += 1) {
    offset += getBlockTextLength(documentModel.blocks[index]);

    if (index < lastIndex) {
      offset += BLOCK_SEPARATOR_LENGTH;
    }
  }

  return offset;
};

const getBlockIndexById = (documentModel: Document, blockId: string): number => {
  const blockIndex = documentModel.blocks.findIndex((block) => block.id === blockId);

  return blockIndex === -1 ? 0 : blockIndex;
};

export const clampSelectionPoint = (
  documentModel: Document,
  point: SelectionPoint,
): SelectionPoint => {
  const blockIndex = getBlockIndexById(documentModel, point.blockId);
  const block = getBlockOrDefault(documentModel, blockIndex);
  const blockLength = getBlockTextLength(block);

  return {
    blockId: block.id,
    offset: clampOffset(point.offset, 0, blockLength),
  };
};

export const normalizeSelectionRange = (
  documentModel: Document,
  selectionRange: EditorSelection,
): EditorSelection => ({
  anchor: clampSelectionPoint(documentModel, selectionRange.anchor),
  focus: clampSelectionPoint(documentModel, selectionRange.focus),
});

export const isSelectionCollapsed = (selectionRange: EditorSelection): boolean =>
  selectionRange.anchor.blockId === selectionRange.focus.blockId &&
  selectionRange.anchor.offset === selectionRange.focus.offset;

export const selectionPointToLinearOffset = (
  documentModel: Document,
  point: SelectionPoint,
): number => {
  const normalizedPoint = clampSelectionPoint(documentModel, point);
  const blockIndex = getBlockIndexById(documentModel, normalizedPoint.blockId);
  const block = getBlockOrDefault(documentModel, blockIndex);

  return (
    getBlockStartOffset(documentModel, blockIndex) +
    clampOffset(normalizedPoint.offset, 0, getBlockTextLength(block))
  );
};

export const selectionRangeToLinearRange = (
  documentModel: Document,
  selectionRange: EditorSelection,
): LinearSelection => {
  const normalizedSelection = normalizeSelectionRange(documentModel, selectionRange);
  const anchor = selectionPointToLinearOffset(documentModel, normalizedSelection.anchor);
  const focus = selectionPointToLinearOffset(documentModel, normalizedSelection.focus);

  return {
    start: Math.min(anchor, focus),
    end: Math.max(anchor, focus),
    isBackward: anchor > focus,
  };
};

export const linearOffsetToSelectionPoint = (
  documentModel: Document,
  linearOffset: number,
): SelectionPoint => {
  const documentLength = getDocumentText(documentModel).length;
  let remainingOffset = clampOffset(linearOffset, 0, documentLength);
  const lastIndex = documentModel.blocks.length - 1;

  for (let blockIndex = 0; blockIndex < documentModel.blocks.length; blockIndex += 1) {
    const block = documentModel.blocks[blockIndex];
    const blockLength = getBlockTextLength(block);

    if (remainingOffset <= blockLength || blockIndex === lastIndex) {
      return {
        blockId: block.id,
        offset: clampOffset(remainingOffset, 0, blockLength),
      };
    }

    remainingOffset -= blockLength + BLOCK_SEPARATOR_LENGTH;
  }

  const lastBlock = getBlockOrDefault(documentModel, lastIndex);

  return {
    blockId: lastBlock.id,
    offset: getBlockTextLength(lastBlock),
  };
};

export const linearRangeToSelectionRange = (
  documentModel: Document,
  linearRange: LinearSelection,
): EditorSelection => {
  const anchor = linearOffsetToSelectionPoint(
    documentModel,
    linearRange.isBackward ? linearRange.end : linearRange.start,
  );
  const focus = linearOffsetToSelectionPoint(
    documentModel,
    linearRange.isBackward ? linearRange.start : linearRange.end,
  );

  return { anchor, focus };
};
