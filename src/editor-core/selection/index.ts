export type { SelectionPoint, EditorSelection, LinearSelection } from './types';
export {
    clampSelectionPoint,
    normalizeSelectionRange,
    isSelectionCollapsed,
    selectionPointToLinearOffset,
    selectionRangeToLinearRange,
    linearOffsetToSelectionPoint,
    linearRangeToSelectionRange,
} from './selection';
