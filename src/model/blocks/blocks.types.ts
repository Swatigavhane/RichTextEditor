import type { InlineMark } from '../types';

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
