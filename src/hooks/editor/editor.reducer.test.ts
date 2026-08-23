import { describe, expect, it } from 'vitest';
import { buildDocument } from '../../utils';
import { createInitialState } from './editor.reducer';

describe('editor initial state', () => {
  it('starts with the supplied document model', () => {
    const state = createInitialState(buildDocument(['Initial content']));

    expect(state.documentModel.blocks[0].children[0].text).toBe('Initial content');
    expect(state.selection.anchor.blockId).toBe('block-1');
    expect(state.selection.anchor.offset).toBe(0);
    expect(state.history.past).toHaveLength(0);
  });
});
