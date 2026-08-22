import { useMemo, useState } from 'react';
import { createEmptyDocument, serializeDocument, toggleMark } from '../model';
import type { Document, Mark } from '../model';
import type { EditorSelection } from '../editor-core/selection';
import { buildSelection } from '../utils/buildSelection';
import { COMMON_MARKS } from './constants';

export const useEditor = () => {
  const [documentModel, setDocumentModel] = useState<Document>(() => createEmptyDocument());
  const [selection, setSelection] = useState<EditorSelection>(() =>
    buildSelection('block-1', 0, 'block-1', 0),
  );

  const activeMarks = useMemo(() => [], []);

  const toggle = (mark: Mark) => {
    setDocumentModel((currentDocument: Document) => toggleMark(currentDocument, selection, mark));
  };

  return {
    documentModel,
    selection,
    activeMarks,
    serializedDocument: serializeDocument(documentModel),
    setSelection,
    toggleBold: () => toggle(COMMON_MARKS.bold),
    toggleItalic: () => toggle(COMMON_MARKS.italic),
    insertLink: () => toggle(COMMON_MARKS.link),
  };
};
