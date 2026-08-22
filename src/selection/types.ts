export type { SelectionPoint, SelectionRange as EditorSelection } from '../features/editor/model';

export type LinearSelection = {
	start: number;
	end: number;
	isBackward: boolean;
};