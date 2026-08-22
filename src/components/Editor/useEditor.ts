import { useMemo, useState } from 'react';
import { createEmptyDocument, serializeDocument, toggleMark } from '../../model';
import type { Document, Mark } from '../../model';
import type { EditorSelection } from '../../selection';
import { buildSelection } from '../../test-utils/buildSelection';

export const useEditor = () => {
    const [documentModel, setDocumentModel] = useState<Document>(() => createEmptyDocument());
    const [selection, setSelection] = useState<EditorSelection>(() => buildSelection('block-1', 0, 'block-1', 0));

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
        toggleBold: () => toggle('bold'),
        toggleItalic: () => toggle('italic'),
        insertLink: () => toggle({ type: 'link', href: 'https://example.com' }),
    };
};