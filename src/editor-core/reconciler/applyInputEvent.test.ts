import { describe, expect, it } from 'vitest';
import { createEmptyDocument } from '../../model';
import { buildSelection } from '../../utils/buildSelection';
import { applyInputEvent } from './applyInputEvent';

describe('apply input event', () => {
    it('reconciles a simple text replacement', () => {
        const result = applyInputEvent(createEmptyDocument(), {
            beforeText: '',
            afterText: 'Hello',
            selection: buildSelection('block-1', 0, 'block-1', 0),
        });

        expect(result.blocks[0].children).toEqual([{ text: 'Hello', marks: [] }]);
    });
});