import { useMemo, useReducer } from 'react';
import { createEmptyDocument, getActiveMarks, serializeDocument, toggleMark } from '../model';
import type { Document, Mark } from '../model';
import type { EditorSelection } from '../editor-core/selection';
import { buildSelection } from '../utils/buildSelection';
import { COMMON_MARKS } from './constants';

type EditorState = {
  documentModel: Document;
  selection: EditorSelection;
};

type EditorAction =
  | {
      type: 'selection/set';
      selection: EditorSelection;
    }
  | {
      type: 'mark/toggle';
      mark: Mark;
    };

const createInitialState = (): EditorState => ({
  documentModel: createEmptyDocument(),
  selection: buildSelection('block-1', 0, 'block-1', 0),
});

const editorReducer = (state: EditorState, action: EditorAction): EditorState => {
  switch (action.type) {
    case 'selection/set':
      return {
        ...state,
        selection: action.selection,
      };
    case 'mark/toggle':
      return {
        ...state,
        documentModel: toggleMark(state.documentModel, state.selection, action.mark),
      };
    default:
      return state;
  }
};

export const useEditor = () => {
  const [state, dispatch] = useReducer(editorReducer, undefined, createInitialState);

  const activeMarks = useMemo(
    () =>
      getActiveMarks(state.documentModel, state.selection).map((mark: Mark) =>
        typeof mark === 'string' ? mark : mark.type,
      ),
    [state.documentModel, state.selection],
  );

  const serializedDocument = useMemo(
    () => serializeDocument(state.documentModel),
    [state.documentModel],
  );

  const toggle = (mark: Mark) => {
    dispatch({ type: 'mark/toggle', mark });
  };

  const setSelection = (nextSelection: EditorSelection) => {
    dispatch({ type: 'selection/set', selection: nextSelection });
  };

  return {
    documentModel: state.documentModel,
    selection: state.selection,
    activeMarks,
    serializedDocument,
    setSelection,
    toggleBold: () => toggle(COMMON_MARKS.bold),
    toggleItalic: () => toggle(COMMON_MARKS.italic),
    insertLink: () => toggle(COMMON_MARKS.link),
  };
};
