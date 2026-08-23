import { useMemo, useReducer } from 'react';
import type { EditorSelection } from '../editor-core/selection';
import type { Document } from '../model';
import type { ActiveMarkId, EditorCommandId } from '../editor-core/commands';
import { EditorCommand } from '../editor-core/commands';
import {
  EDITOR_ACTIONS,
  createInitialState,
  editorReducer,
  selectActiveMarks,
  selectSerializedDocument,
} from './editor';

type EditorViewModel = {
  documentModel: Document;
  selection: EditorSelection;
  activeMarks: ActiveMarkId[];
  serializedDocument: string;
  setSelection: (selection: EditorSelection) => void;
  runCommand: (command: EditorCommandId) => void;
  applyInput: (beforeText: string, afterText: string, selection: EditorSelection) => void;
  insertNewline: (selection: EditorSelection) => void;
  insertText: (text: string, selection: EditorSelection) => void;
  applyLink: (href: string, selection: EditorSelection) => void;
  canUndo: boolean;
  canRedo: boolean;
};

/** Builds the context view model around the editor reducer. */
const useEditorState = (initialDocumentModel?: Document): EditorViewModel => {
  const [editorState, dispatch] = useReducer(
    editorReducer,
    initialDocumentModel,
    createInitialState,
  );

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

  /** Inserts literal text at the current selection. */
  const insertText = (text: string, selection: EditorSelection) => {
    dispatch({ type: EDITOR_ACTIONS.INSERT_TEXT, text, selection });
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
    insertText,
    applyLink,
    canUndo: editorState.history.past.length > 0,
    canRedo: editorState.history.future.length > 0,
  };
};

/** Provides the editor context through the public hook API. */
/** Reads editor context and fails when used outside its provider. */
// The useEditorContext hook has been removed as it is no longer needed.
/** Creates the editor view model from an optional initial document. */
export const useEditor = (initialDocumentModel?: Document): EditorViewModel =>
  useEditorState(initialDocumentModel);
