import type { EditorSelection } from '../../editor-core/selection';
import type { EditorCommandId } from '../../editor-core/commands';
import type { Document } from '../../model';
import type { HistoryStack } from '../../editor-core/history';

export type EditorSnapshot = {
  documentModel: Document;
  selection: EditorSelection;
};

export type EditorState = {
  documentModel: Document;
  selection: EditorSelection;
  history: HistoryStack<EditorSnapshot>;
};

export const EDITOR_ACTIONS = {
  SET_SELECTION: 'SET_SELECTION',
  RUN_COMMAND: 'RUN_COMMAND',
  APPLY_INPUT: 'APPLY_INPUT',
  UNDO: 'UNDO',
  REDO: 'REDO',
} as const;

export type EditorAction =
  | {
    type: typeof EDITOR_ACTIONS.SET_SELECTION;
    selection: EditorSelection;
  }
  | {
    type: typeof EDITOR_ACTIONS.RUN_COMMAND;
    command: EditorCommandId;
  }
  | {
    type: typeof EDITOR_ACTIONS.APPLY_INPUT;
    beforeText: string;
    afterText: string;
    selection: EditorSelection;
  }
  | {
    type: typeof EDITOR_ACTIONS.UNDO;
  }
  | {
    type: typeof EDITOR_ACTIONS.REDO;
  };
