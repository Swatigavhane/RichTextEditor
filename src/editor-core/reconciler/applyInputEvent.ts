import type { Document } from '../../model';
import { replaceSelectionWithText } from '../../model';
import type { EditorSelection } from '../selection';
import { buildSelection } from '../../utils/buildSelection';
import { diffText } from './diffText';

export type InputEventChange = {
  beforeText: string;
  afterText: string;
  selection: EditorSelection;
};

/** Checks whether a block contains no text. */
const isEmptyBlock = (block: Document['blocks'][number] | undefined): boolean =>
  Boolean(
    block && block.children.length > 0 && block.children.every((run) => run.text.length === 0),
  );

/** Replaces the first block's content while preserving the rest of the document. */
const replaceFirstBlockText = (documentModel: Document, text: string): Document => {
  const firstBlock = documentModel.blocks[0];

  if (!firstBlock) {
    return documentModel;
  }

  return {
    blocks: [
      {
        ...firstBlock,
        children: [{ text, marks: [] }],
      },
      ...documentModel.blocks.slice(1),
    ],
  };
};

// Applies a browser text edit to the document model using the current selection.
export const applyInputEvent = (documentModel: Document, change: InputEventChange): Document => {
  const textDiff = diffText(change.beforeText, change.afterText);
  const blockId = change.selection.anchor.blockId;
  const selection = buildSelection(
    blockId,
    textDiff.start,
    blockId,
    textDiff.start + textDiff.deletedText.length,
  );
  const nextDocument = replaceSelectionWithText(
    documentModel,
    selection,
    textDiff.insertedText,
    [],
  ).document;

  const firstBlockIsEmpty = isEmptyBlock(nextDocument.blocks[0]);

  if (textDiff.insertedText.length > 0 && firstBlockIsEmpty) {
    return replaceFirstBlockText(nextDocument, textDiff.insertedText);
  }

  return nextDocument;
};
