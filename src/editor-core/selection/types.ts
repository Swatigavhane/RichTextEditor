export type SelectionPoint = {
    blockId: string;
    offset: number;
};

export type EditorSelection = {
    anchor: SelectionPoint;
    focus: SelectionPoint;
};

export type LinearSelection = {
    start: number;
    end: number;
    isBackward: boolean;
};