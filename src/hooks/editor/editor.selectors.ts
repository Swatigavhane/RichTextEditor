import { getSelectionMarks, serializeDocument } from '../../model';
import type { ActiveMarkId } from '../../editor-core/commands';
import type { EditorState } from './editor.types';

/** Returns marks shared by the current selection for toolbar state. */
export const selectActiveMarks = (state: EditorState): ActiveMarkId[] =>
  getSelectionMarks(state.documentModel, state.selection).map((mark) =>
    typeof mark === 'string' ? mark : mark.type,
  );

/** Serializes the current document for persistence or inspection. */
export const selectSerializedDocument = (state: EditorState): string =>
  serializeDocument(state.documentModel);
