export type InlineMarkType = 'bold' | 'italic';

export interface LinkMark {
  type: 'link';
  href: string;
}

export type InlineMark = InlineMarkType | LinkMark;

export interface TextSpan {
  text: string;
  marks: InlineMark[];
}

export interface ParagraphBlock {
  type: 'paragraph';
  id: string;
  children: TextSpan[];
}

export type Block = ParagraphBlock;

export interface DocumentModel {
  blocks: Block[];
}

export interface SelectionPoint {
  blockId: string;
  offset: number;
}

export interface SelectionRange {
  anchor: SelectionPoint;
  focus: SelectionPoint;
}

export interface LinearSelectionRange {
  anchor: number;
  focus: number;
  start: number;
  end: number;
  isBackward: boolean;
}

export type MarkCoverage = 'absent' | 'partial' | 'present';

export type Mark = InlineMark;
export type Document = DocumentModel;

export type TextRun = TextSpan;
