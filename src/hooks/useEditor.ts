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

const useEditorState = () => {
  const [editorState, dispatch] = useReducer(editorReducer, undefined, createInitialState);

  const activeMarks = useMemo(() => selectActiveMarks(editorState), [editorState]);

  const serializedDocument = useMemo(
    () => selectSerializedDocument(editorState),
    [editorState],
  );

  const setSelection = (nextSelection: EditorSelection) => {
    dispatch({ type: EDITOR_ACTIONS.SET_SELECTION, selection: nextSelection });
  };

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

  const applyInput = (beforeText: string, afterText: string, selection: EditorSelection) => {
    dispatch({
      type: EDITOR_ACTIONS.APPLY_INPUT,
      beforeText,
      afterText,
      selection,
    });
  };

  return {
    documentModel: editorState.documentModel,
    selection: editorState.selection,
    activeMarks,
    serializedDocument,
    setSelection,
    runCommand,
    applyInput,
    canUndo: editorState.history.past.length > 0,
    canRedo: editorState.history.future.length > 0,
  };
};

type EditorViewModel = ReturnType<typeof useEditorState>;

const EditorContext = createContext<EditorViewModel | null>(null);

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const editorViewModel = useEditorState();

  return createElement(EditorContext.Provider, { value: editorViewModel }, children);
};

export const useEditor = () => useEditorContext();

export const useEditorContext = (): EditorViewModel => {
  const editorContext = useContext(EditorContext);

  if (!editorContext) {
    throw new Error('useEditorContext must be used within an EditorProvider');
  }

  return editorContext;
};
