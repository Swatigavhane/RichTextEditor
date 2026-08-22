// Public document API: create, normalize, serialize, and deserialize documents.
import type { DocumentModel, ParagraphBlock } from '../types';
import { cloneDocument } from './document.clone';
import { normalizeDocumentModel } from './document.normalize';
import { isDocumentModel } from './document.validation';

const DEFAULT_BLOCK_ID = 'block-1';
const EMPTY_SPAN = { text: '', marks: [] };

export const createParagraph = (id: string, text = ''): ParagraphBlock => ({
  type: 'paragraph',
  id,
  children: text.length > 0 ? [{ text, marks: [] }] : [EMPTY_SPAN],
});

export const createEmptyDocument = (): DocumentModel => ({
  blocks: [createParagraph(DEFAULT_BLOCK_ID)],
});

export const normalizeDocument = (documentModel: DocumentModel): DocumentModel => ({
  blocks: normalizeDocumentModel(documentModel).blocks,
});

export const serializeDocument = (documentModel: DocumentModel): string =>
  JSON.stringify(normalizeDocument(documentModel));

export const deserializeDocument = (serializedDocument: string): DocumentModel => {
  const parsedDocument = JSON.parse(serializedDocument) as unknown;

  if (!isDocumentModel(parsedDocument)) {
    throw new Error('Invalid document model');
  }

  return normalizeDocument(parsedDocument);
};

export const getBlockTextLength = (block: ParagraphBlock): number =>
  block.children.reduce((length, span) => length + span.text.length, 0);

export const getDocumentText = (documentModel: DocumentModel): string =>
  documentModel.blocks
    .map((block) => block.children.map((span) => span.text).join(''))
    .join('\n');

export { cloneDocument };
