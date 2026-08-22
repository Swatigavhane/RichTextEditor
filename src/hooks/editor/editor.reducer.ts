import { buildSelection } from '../../utils/buildSelection';
import { createEmptyDocument, toggleMark } from '../../model';
import { TOOLBAR_COMMANDS } from '../constants';
import type { EditorAction, EditorState } from './editor.types';

export const createInitialState = (): EditorState => ({
  documentModel: createEmptyDocument(),
  selection: buildSelection('block-1', 0, 'block-1', 0),
});

export const editorReducer = (state: EditorState, action: EditorAction): EditorState => {
  const toggleMarkInState = (mark: Parameters<typeof toggleMark>[2]): EditorState => ({
    ...state,
    documentModel: toggleMark(state.documentModel, state.selection, mark),
  });

  switch (action.type) {
    case 'selection/set':
      return {
        ...state,
        selection: action.selection,
      };
    case 'mark/toggle':
      return toggleMarkInState(action.mark);
    case 'command/run': {
      const commandConfig = TOOLBAR_COMMANDS.find((command) => command.id === action.command);

      if (!commandConfig) {
        return state;
      }

      return toggleMarkInState(commandConfig.mark);
    }
    default:
      return state;
  }
};
