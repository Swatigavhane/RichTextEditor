import { useMemo, useReducer } from 'react';
import type { EditorSelection } from '../editor-core/selection';
import type { EditorCommandId } from './constants';
import {
  createInitialState,
  editorReducer,
  selectActiveMarks,
  selectSerializedDocument,
  selectToolbarCommands,
} from './editor';

export const useEditor = () => {
  const [state, dispatch] = useReducer(editorReducer, undefined, createInitialState);

  const activeMarks = useMemo(() => selectActiveMarks(state), [state]);

  const serializedDocument = useMemo(() => selectSerializedDocument(state), [state]);

  const toolbarCommands = useMemo(() => selectToolbarCommands(activeMarks), [activeMarks]);

  const setSelection = (nextSelection: EditorSelection) => {
    dispatch({ type: 'selection/set', selection: nextSelection });
  };

  const runCommand = (command: EditorCommandId) => {
    dispatch({ type: 'command/run', command });
  };

  return {
    documentModel: state.documentModel,
    selection: state.selection,
    activeMarks,
    toolbarCommands,
    serializedDocument,
    setSelection,
    runCommand,
  };
};
