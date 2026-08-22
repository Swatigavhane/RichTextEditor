import { useMemo, useReducer } from 'react';
import type { EditorSelection } from '../editor-core/selection';
import type { EditorCommandId } from '../editor-core/commands';
import {
  createInitialState,
  editorReducer,
  selectActiveMarks,
  selectSerializedDocument,
  selectToolbarCommands,
} from './editor';

export const useEditor = () => {
  const [editorState, dispatch] = useReducer(editorReducer, undefined, createInitialState);

  const activeMarks = useMemo(() => selectActiveMarks(editorState), [editorState]);

  const serializedDocument = useMemo(
    () => selectSerializedDocument(editorState),
    [editorState],
  );

  const toolbarCommands = useMemo(() => selectToolbarCommands(activeMarks), [activeMarks]);

  const setSelection = (nextSelection: EditorSelection) => {
    dispatch({ type: 'selection/set', selection: nextSelection });
  };

  const runCommand = (command: EditorCommandId) => {
    dispatch({ type: 'command/run', command });
  };

  return {
    documentModel: editorState.documentModel,
    selection: editorState.selection,
    activeMarks,
    toolbarCommands,
    serializedDocument,
    setSelection,
    runCommand,
  };
};
