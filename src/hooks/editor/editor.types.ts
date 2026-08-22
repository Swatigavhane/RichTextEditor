import type { EditorSelection } from '../../editor-core/selection';
import type { Document, Mark } from '../../model';
import type { EditorCommandId } from '../constants';

export type ToolbarCommand = {
  id: EditorCommandId;
  label: string;
  isActive: boolean;
};

export type EditorState = {
  documentModel: Document;
  selection: EditorSelection;
};

export type EditorAction =
  | {
      type: 'selection/set';
      selection: EditorSelection;
    }
  | {
      type: 'mark/toggle';
      mark: Mark;
    }
  | {
      type: 'command/run';
      command: EditorCommandId;
    };
