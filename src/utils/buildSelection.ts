import type { EditorSelection } from '../editor-core/selection';

// Creates a model selection from two block-relative endpoints.
export const buildSelection = (
  anchorBlockId: string,
  anchorOffset: number,
  focusBlockId: string,
  focusOffset: number,
): EditorSelection => ({
  anchor: { blockId: anchorBlockId, offset: anchorOffset },
  focus: { blockId: focusBlockId, offset: focusOffset },
});
