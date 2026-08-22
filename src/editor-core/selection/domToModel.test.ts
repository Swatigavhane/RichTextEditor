import { describe, expect, it } from 'vitest';
import { createEmptyDocument } from '../../model';
import { domToModelSelection } from './domToModel';

describe('dom to model selection', () => {
    it('maps a model selection to a linear selection', () => {
        const documentModel = createEmptyDocument();

        expect(
            domToModelSelection(documentModel, {
                anchor: { blockId: 'block-1', offset: 0 },
                focus: { blockId: 'block-1', offset: 0 },
            }),
        ).toEqual({ start: 0, end: 0, isBackward: false });
    });
});