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

export const createEmptyDocument = (): DocumentModel => ({
  blocks: [
    {
      type: 'paragraph',
      id: 'block-1',
      children: [{ text: '', marks: [] }],
    },
  ],
});

export const serializeDocument = (documentModel: DocumentModel): string =>
  JSON.stringify(documentModel);

export const deserializeDocument = (serializedDocument: string): DocumentModel =>
  JSON.parse(serializedDocument) as DocumentModel;
