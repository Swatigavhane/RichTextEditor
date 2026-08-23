import { buildSelection } from '../../utils/buildSelection';
import { createEmptyDocument, toggleInlineMark } from '../../model';
import { normalizeSelectionRange } from '../../editor-core/selection';
import { resolveEditorCommandMark } from '../../editor-core/commands';
import { applyInputEvent } from '../../editor-core/reconciler';
import { diffText } from '../../editor-core/reconciler/diffText';
import {
  createHistoryStack,
  pushHistoryEntry,
  redoHistory,
  undoHistory,
} from '../../editor-core/history';
import { EDITOR_ACTIONS } from './editor.types';
import type { EditorAction, EditorSnapshot, EditorState } from './editor.types';

const INITIAL_BLOCK_ID = 'block-1';

const withSelection = (
  state: EditorState,
  selection: Extract<EditorAction, { type: typeof EDITOR_ACTIONS.SET_SELECTION }>['selection'],
): EditorState => ({
  ...state,
  selection,
});

const commitDocumentChange = (
  state: EditorState,
  documentModel: EditorState['documentModel'],
  selection = state.selection,
): EditorState => {
  const normalizedSelection = normalizeSelectionRange(documentModel, selection);

  return {
    ...state,
    documentModel,
    selection: normalizedSelection,
    history: pushHistoryEntry(state.history, {
      state: { documentModel, selection: normalizedSelection },
      timestamp: Date.now(),
    }),
  };
};

const restoreHistory = (
  history: EditorState['history'],
  snapshot: EditorSnapshot,
): EditorState => ({
  ...snapshot,
  history,
});

export const createInitialState = (): EditorState => {
  const documentModel = createEmptyDocument();
  const selection = buildSelection(INITIAL_BLOCK_ID, 0, INITIAL_BLOCK_ID, 0);

  return {
    documentModel,
    selection,
    history: createHistoryStack({ documentModel, selection }),
  };
};

export const editorReducer = (state: EditorState, action: EditorAction): EditorState => {
  switch (action.type) {
    case EDITOR_ACTIONS.SET_SELECTION:
      return withSelection(state, action.selection);
    case EDITOR_ACTIONS.RUN_COMMAND: {
      const commandMark = resolveEditorCommandMark(action.command);

      if (!commandMark) {
        return state;
      }

      return commitDocumentChange(
        state,
        toggleInlineMark(state.documentModel, state.selection, commandMark),
      );
    }
    case EDITOR_ACTIONS.APPLY_INPUT: {
      const nextDocumentModel = applyInputEvent(state.documentModel, {
        beforeText: action.beforeText,
        afterText: action.afterText,
        selection: action.selection,
      });
      const textDiff = diffText(action.beforeText, action.afterText);
      const caretOffset = textDiff.start + textDiff.insertedText.length;
      const blockId = action.selection.anchor.blockId;

      return commitDocumentChange(
        state,
        nextDocumentModel,
        buildSelection(blockId, caretOffset, blockId, caretOffset),
      );
    }
    case EDITOR_ACTIONS.UNDO: {
      const history = undoHistory(state.history);

      return history === state.history ? state : restoreHistory(history, history.present.state);
    }
    case EDITOR_ACTIONS.REDO: {
      const history = redoHistory(state.history);

      return history === state.history ? state : restoreHistory(history, history.present.state);
    }
    default:
      return state;
  }
};
