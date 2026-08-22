import { describe, expect, it } from 'vitest';
import { createEmptyDocument, createParagraph, deserializeDocument, normalizeDocument, serializeDocument } from './index';

describe('document serialization', () => {
    it('serializes and deserializes a canonical document', () => {
        const documentModel = normalizeDocument({
            blocks: [
                createParagraph('block-1', 'Hello'),
                {
                    type: 'paragraph',
                    id: 'block-2',
                    children: [
                        { text: ' ', marks: [] },
                        { text: 'world', marks: [] },
                    ],
                },
            ],
        });

        const roundTripped = deserializeDocument(serializeDocument(documentModel));

        expect(roundTripped).toEqual(documentModel);
    });

    it('creates an empty document', () => {
        expect(createEmptyDocument()).toEqual({
            blocks: [
                {
                    type: 'paragraph',
                    id: 'block-1',
                    children: [{ text: '', marks: [] }],
                },
            ],
        });
    });
});