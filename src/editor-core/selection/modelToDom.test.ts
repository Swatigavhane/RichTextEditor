import { describe, expect, it } from 'vitest';
import { createEmptyDocument } from '../../model';
import { modelToDomSelection } from './modelToDom';

describe('model to dom selection', () => {
    it('maps a linear selection back to a model selection', () => {
        const documentModel = createEmptyDocument();

        expect(modelToDomSelection(documentModel, { start: 0, end: 0, isBackward: false })).toEqual({
            anchor: { blockId: 'block-1', offset: 0 },
            focus: { blockId: 'block-1', offset: 0 },
        });
    });
});