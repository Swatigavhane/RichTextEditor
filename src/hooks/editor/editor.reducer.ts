import { buildSelection } from '../../utils/buildSelection';
import { createEmptyDocument, toggleMark } from '../../model';
import { TOOLBAR_COMMANDS } from '../../editor-core/commands';
import type { EditorAction, EditorState } from './editor.types';

const INITIAL_BLOCK_ID = 'block-1';

const COMMAND_TO_MARK = new Map(
  TOOLBAR_COMMANDS.map((command) => [command.id, command.mark] as const),
);

const resolveCommandMark = (command: Extract<EditorAction, { type: 'command/run' }>['command']) =>
  COMMAND_TO_MARK.get(command);

const withSelection = (
  state: EditorState,
  selection: Extract<EditorAction, { type: 'selection/set' }>['selection'],
): EditorState => ({
  ...state,
  selection,
});

const withToggledMark = (
  state: EditorState,
  mark: Parameters<typeof toggleMark>[2],
): EditorState => ({
  ...state,
  documentModel: toggleMark(state.documentModel, state.selection, mark),
});

export const createInitialState = (): EditorState => ({
  documentModel: createEmptyDocument(),
  selection: buildSelection(INITIAL_BLOCK_ID, 0, INITIAL_BLOCK_ID, 0),
});

export const editorReducer = (state: EditorState, action: EditorAction): EditorState => {
  switch (action.type) {
    case 'selection/set':
      return withSelection(state, action.selection);
    case 'mark/toggle':
      return withToggledMark(state, action.mark);
    case 'command/run': {
      const commandMark = resolveCommandMark(action.command);

      if (!commandMark) {
        return state;
      }

      return withToggledMark(state, commandMark);
    }
    default:
      return state;
  }
};
