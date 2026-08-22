import type { Document } from '../model';
import { selectionRangeToLinearRange } from '../features/editor/model';
import type { EditorSelection, LinearSelection } from './types';

export const domToModelSelection = (documentModel: Document, selection: EditorSelection): LinearSelection => {
    const linearSelection = selectionRangeToLinearRange(documentModel, selection);

    return {
        start: linearSelection.start,
        end: linearSelection.end,
        isBackward: linearSelection.isBackward,
    };
};