// Public document API: create, normalize, serialize, and deserialize documents.
import type { DocumentModel, ParagraphBlock } from '../types';
import { DEFAULT_BLOCK_ID, EMPTY_TEXT_SPAN } from '../constants';
import { cloneDocument } from './core/clone';
import { normalizeDocumentModel } from './core/normalize';
import { isDocumentModel } from './core/validation';

// Creates a paragraph block with optional plain text content.
export const createParagraph = (id: string, text = ''): ParagraphBlock => ({
  type: 'paragraph',
  id,
  children: text.length > 0 ? [{ text, marks: [] }] : [EMPTY_TEXT_SPAN],
});

// Creates a document with one empty paragraph.
export const createEmptyDocument = (): DocumentModel => ({
  blocks: [createParagraph(DEFAULT_BLOCK_ID)],
});

// Normalizes every block and text run in a document.
export const normalizeDocument = (documentModel: DocumentModel): DocumentModel => ({
  blocks: normalizeDocumentModel(documentModel).blocks,
});

// Serializes a normalized document to JSON.
export const serializeDocument = (documentModel: DocumentModel): string =>
  JSON.stringify(normalizeDocument(documentModel));

// Parses and validates a serialized document before normalizing it.
export const deserializeDocument = (serializedDocument: string): DocumentModel => {
  const parsedDocument = JSON.parse(serializedDocument) as unknown;

  if (!isDocumentModel(parsedDocument)) {
    throw new Error('Invalid document model');
  }

  return normalizeDocument(parsedDocument);
};

export const getBlockTextLength = (block: ParagraphBlock): number =>
  block.children.reduce((length, span) => length + span.text.length, 0);

// Returns all block text joined with document separators.
export const getDocumentText = (documentModel: DocumentModel): string =>
  documentModel.blocks.map((block) => block.children.map((span) => span.text).join('')).join('\n');

export { cloneDocument };
