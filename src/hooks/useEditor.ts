import { createContext, createElement, useContext, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { EditorSelection } from '../editor-core/selection';
import { EditorCommand } from '../editor-core/commands';
import type { EditorCommandId } from '../editor-core/commands';
import {
  EDITOR_ACTIONS,
  createInitialState,
  editorReducer,
  selectActiveMarks,
  selectSerializedDocument,
} from './editor';

/** Builds the context view model around the editor reducer. */
const useEditorState = () => {
  const [editorState, dispatch] = useReducer(editorReducer, undefined, createInitialState);

  const activeMarks = useMemo(() => selectActiveMarks(editorState), [editorState]);

  const serializedDocument = useMemo(() => selectSerializedDocument(editorState), [editorState]);

  /** Dispatches a selection update to the editor reducer. */
  const setSelection = (nextSelection: EditorSelection) => {
    dispatch({ type: EDITOR_ACTIONS.SET_SELECTION, selection: nextSelection });
  };

  /** Dispatches a formatting, undo, or redo command. */
  const runCommand = (command: EditorCommandId) => {
    if (command === EditorCommand.UNDO) {
      dispatch({ type: EDITOR_ACTIONS.UNDO });
      return;
    }

    if (command === EditorCommand.REDO) {
      dispatch({ type: EDITOR_ACTIONS.REDO });
      return;
    }

    dispatch({ type: EDITOR_ACTIONS.RUN_COMMAND, command });
  };

  /** Dispatches a browser text change for reconciliation and history tracking. */
  const applyInput = (beforeText: string, afterText: string, selection: EditorSelection) => {
    dispatch({
      type: EDITOR_ACTIONS.APPLY_INPUT,
      beforeText,
      afterText,
      selection,
    });
  };

  /** Inserts a newline at the current selection. */
  const insertNewline = (selection: EditorSelection) => {
    dispatch({ type: EDITOR_ACTIONS.INSERT_NEWLINE, selection });
  };

  /** Applies a URL link mark to the current selection. */
  const applyLink = (href: string, selection: EditorSelection) => {
    dispatch({ type: EDITOR_ACTIONS.APPLY_LINK, href, selection });
  };

  return {
    documentModel: editorState.documentModel,
    selection: editorState.selection,
    activeMarks,
    serializedDocument,
    setSelection,
    runCommand,
    applyInput,
    insertNewline,
    applyLink,
    canUndo: editorState.history.past.length > 0,
    canRedo: editorState.history.future.length > 0,
  };
};

type EditorViewModel = ReturnType<typeof useEditorState>;

const EditorContext = createContext<EditorViewModel | null>(null);

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  /** Makes editor state and commands available to all editor descendants. */
  const editorViewModel = useEditorState();

  return createElement(EditorContext.Provider, { value: editorViewModel }, children);
};

/** Provides the editor context through the public hook API. */
/** Reads editor context and fails when used outside its provider. */
export const useEditorContext = (): EditorViewModel => {
  const editorContext = useContext(EditorContext);

  if (!editorContext) {
    throw new Error('useEditorContext must be used within an EditorProvider');
  }

  return editorContext;
};
