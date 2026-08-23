import { getSelectionMarks, serializeDocument } from '../../model';
import type { ActiveMarkId } from '../../editor-core/commands';
import type { EditorState } from './editor.types';

export const selectActiveMarks = (state: EditorState): ActiveMarkId[] =>
  // Returns marks shared by the current selection for toolbar state.
  getSelectionMarks(state.documentModel, state.selection).map((mark) =>
    typeof mark === 'string' ? mark : mark.type,
  );

export const selectSerializedDocument = (state: EditorState): string =>
  // Serializes the current document for persistence or inspection.
  serializeDocument(state.documentModel);
