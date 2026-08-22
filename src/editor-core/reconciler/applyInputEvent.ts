import type { Document } from '../../model';
import { replaceSelectionWithText } from '../../model';
import type { EditorSelection } from '../selection';
import { diffText } from './diffText';

export type InputEventChange = {
  beforeText: string;
  afterText: string;
  selection: EditorSelection;
};

export const applyInputEvent = (documentModel: Document, change: InputEventChange): Document => {
  const textDiff = diffText(change.beforeText, change.afterText);
  const nextDocument = replaceSelectionWithText(
    documentModel,
    change.selection,
    textDiff.insertedText,
    [],
  ).document;

  const firstBlock = nextDocument.blocks[0];
  const firstBlockIsEmpty = Boolean(
    firstBlock &&
    firstBlock.children.length > 0 &&
    firstBlock.children.every((run) => run.text.length === 0),
  );

  if (textDiff.insertedText.length > 0 && firstBlockIsEmpty) {
    return {
      blocks: [
        {
          ...firstBlock,
          children: [{ text: textDiff.insertedText, marks: [] }],
        },
        ...nextDocument.blocks.slice(1),
      ],
    };
  }

  return nextDocument;
};
