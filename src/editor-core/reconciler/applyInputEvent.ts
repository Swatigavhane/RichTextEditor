import type { Document } from '../../model';
import { replaceSelectionWithText } from '../../model';
import type { EditorSelection } from '../selection';
import { diffText } from './diffText';

export type InputEventChange = {
  beforeText: string;
  afterText: string;
  selection: EditorSelection;
};

const isEmptyBlock = (block: Document['blocks'][number] | undefined): boolean =>
  Boolean(block && block.children.length > 0 && block.children.every((run) => run.text.length === 0));

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

export const applyInputEvent = (documentModel: Document, change: InputEventChange): Document => {
  const textDiff = diffText(change.beforeText, change.afterText);
  const nextDocument = replaceSelectionWithText(
    documentModel,
    change.selection,
    textDiff.insertedText,
    [],
  ).document;

  const firstBlockIsEmpty = isEmptyBlock(nextDocument.blocks[0]);

  if (textDiff.insertedText.length > 0 && firstBlockIsEmpty) {
    return replaceFirstBlockText(nextDocument, textDiff.insertedText);
  }

  return nextDocument;
};
