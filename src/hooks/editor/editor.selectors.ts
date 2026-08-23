import { getSelectionMarks, serializeDocument } from '../../model';
import type { ActiveMarkId } from '../../editor-core/commands';
import type { EditorState } from './editor.types';

export const selectActiveMarks = (state: EditorState): ActiveMarkId[] =>
  getSelectionMarks(state.documentModel, state.selection).map((mark) =>
    typeof mark === 'string' ? mark : mark.type,
  );

export const selectSerializedDocument = (state: EditorState): string =>
  serializeDocument(state.documentModel);
