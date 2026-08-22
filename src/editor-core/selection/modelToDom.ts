import type { Document } from '../../model';
import { linearRangeToSelectionRange } from './selection';
import type { EditorSelection, LinearSelection } from './types';

export const modelToDomSelection = (
  documentModel: Document,
  selection: LinearSelection,
): EditorSelection => linearRangeToSelectionRange(documentModel, selection);
