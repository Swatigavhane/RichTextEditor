import { getActiveMarks, serializeDocument } from '../../model';
import { TOOLBAR_COMMANDS } from '../constants';
import type { ToolbarCommand, EditorState } from './editor.types';

export const selectActiveMarks = (state: EditorState): Array<'bold' | 'italic' | 'link'> =>
  getActiveMarks(state.documentModel, state.selection).map((mark) =>
    typeof mark === 'string' ? mark : mark.type,
  );

export const selectSerializedDocument = (state: EditorState): string =>
  serializeDocument(state.documentModel);

export const selectToolbarCommands = (
  activeMarks: Array<'bold' | 'italic' | 'link'>,
): ToolbarCommand[] =>
  TOOLBAR_COMMANDS.map((command) => ({
    id: command.id,
    label: command.label,
    isActive: command.activeMark ? activeMarks.includes(command.activeMark) : false,
  }));
