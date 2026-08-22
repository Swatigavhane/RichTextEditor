import { getActiveMarks, serializeDocument } from '../../model';
import type { ActiveMarkId } from '../../editor-core/commands';
import { TOOLBAR_COMMANDS } from '../../editor-core/commands';
import type { ToolbarCommand, EditorState } from './editor.types';

export const selectActiveMarks = (state: EditorState): ActiveMarkId[] =>
  getActiveMarks(state.documentModel, state.selection).map((mark) =>
    typeof mark === 'string' ? mark : mark.type,
  );

export const selectSerializedDocument = (state: EditorState): string =>
  serializeDocument(state.documentModel);

export const selectToolbarCommands = (
  activeMarks: ActiveMarkId[],
): ToolbarCommand[] =>
  TOOLBAR_COMMANDS.map((command) => ({
    id: command.id,
    label: command.label,
    isActive: command.activeMark ? activeMarks.includes(command.activeMark) : false,
  }));
