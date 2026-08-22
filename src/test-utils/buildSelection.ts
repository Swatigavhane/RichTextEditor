import type { EditorSelection } from '../selection';

export const buildSelection = (
    anchorBlockId: string,
    anchorOffset: number,
    focusBlockId: string,
    focusOffset: number,
): EditorSelection => ({
    anchor: { blockId: anchorBlockId, offset: anchorOffset },
    focus: { blockId: focusBlockId, offset: focusOffset },
});