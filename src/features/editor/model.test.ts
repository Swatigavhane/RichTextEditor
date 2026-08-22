import { describe, expect, it } from 'vitest';
import {
    applyInlineMark,
    createEmptyDocument,
    createParagraph,
    deserializeDocument,
    getSelectionMarks,
    linearRangeToSelectionRange,
    normalizeDocument,
    replaceSelectionWithText,
    selectionRangeToLinearRange,
    serializeDocument,
    toggleInlineMark,
} from './model';

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
});

describe('selection mapping', () => {
    it('maps a selection to linear offsets and back', () => {
        const documentModel = normalizeDocument({
            blocks: [createParagraph('block-1', 'Hello'), createParagraph('block-2', 'World')],
        });

        const selection = {
            anchor: { blockId: 'block-1', offset: 1 },
            focus: { blockId: 'block-2', offset: 3 },
        };

        expect(selectionRangeToLinearRange(documentModel, selection)).toEqual({
            anchor: 1,
            focus: 9,
            start: 1,
            end: 9,
            isBackward: false,
        });

        expect(linearRangeToSelectionRange(documentModel, { start: 1, end: 9 })).toEqual(selection);
    });
});

describe('mark application', () => {
    it('toggles bold on a partially bold range by promoting the full selection', () => {
        const documentModel = normalizeDocument({
            blocks: [
                {
                    type: 'paragraph',
                    id: 'block-1',
                    children: [
                        { text: 'He', marks: [] },
                        { text: 'llo', marks: ['bold'] },
                    ],
                },
            ],
        });

        const selection = {
            anchor: { blockId: 'block-1', offset: 0 },
            focus: { blockId: 'block-1', offset: 5 },
        };

        const nextDocument = toggleInlineMark(documentModel, selection, 'bold');

        expect(nextDocument.blocks[0].children).toEqual([
            { text: 'Hello', marks: ['bold'] },
        ]);
    });

    it('removes bold when the entire selection is already bold', () => {
        const documentModel = normalizeDocument({
            blocks: [
                {
                    type: 'paragraph',
                    id: 'block-1',
                    children: [{ text: 'Hello', marks: ['bold'] }],
                },
            ],
        });

        const selection = {
            anchor: { blockId: 'block-1', offset: 0 },
            focus: { blockId: 'block-1', offset: 5 },
        };

        const nextDocument = toggleInlineMark(documentModel, selection, 'bold');

        expect(nextDocument.blocks[0].children).toEqual([{ text: 'Hello', marks: [] }]);
    });

    it('reports mark coverage for a selection', () => {
        const documentModel = normalizeDocument({
            blocks: [
                {
                    type: 'paragraph',
                    id: 'block-1',
                    children: [{ text: 'Hello', marks: ['italic'] }],
                },
            ],
        });

        expect(
            getSelectionMarks(documentModel, {
                anchor: { blockId: 'block-1', offset: 0 },
                focus: { blockId: 'block-1', offset: 5 },
            }),
        ).toEqual(['italic']);
    });
});

describe('text replacement', () => {
    it('replaces a selected range and restores the caret at the insertion point', () => {
        const documentModel = normalizeDocument({
            blocks: [createEmptyDocument().blocks[0], createParagraph('block-2', 'world')],
        });

        const result = replaceSelectionWithText(
            documentModel,
            {
                anchor: { blockId: 'block-2', offset: 0 },
                focus: { blockId: 'block-2', offset: 5 },
            },
            'earth',
            ['italic'],
        );

        expect(result.document.blocks[1].children).toEqual([{ text: 'earth', marks: ['italic'] }]);
        expect(result.selection).toEqual({
            anchor: { blockId: 'block-2', offset: 5 },
            focus: { blockId: 'block-2', offset: 5 },
        });
    });
});