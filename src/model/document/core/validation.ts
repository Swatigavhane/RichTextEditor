// Runtime validators for safely reading serialized document payloads.
import type { DocumentModel, InlineMark, ParagraphBlock, TextSpan } from '../../types';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isInlineMarkType = (value: unknown): value is InlineMark =>
  value === 'bold' || value === 'italic';

const isLinkMark = (value: unknown): value is InlineMark =>
  isObject(value) && value.type === 'link' && typeof value.href === 'string';

const isInlineMark = (value: unknown): value is InlineMark =>
  isInlineMarkType(value) || isLinkMark(value);

const isTextSpan = (value: unknown): value is TextSpan =>
  isObject(value) &&
  typeof value.text === 'string' &&
  Array.isArray(value.marks) &&
  value.marks.every(isInlineMark);

const isParagraphBlock = (value: unknown): value is ParagraphBlock =>
  isObject(value) &&
  value.type === 'paragraph' &&
  typeof value.id === 'string' &&
  Array.isArray(value.children) &&
  value.children.every(isTextSpan);

// Checks whether unknown input matches the document model schema.
export const isDocumentModel = (value: unknown): value is DocumentModel =>
  isObject(value) && Array.isArray(value.blocks) && value.blocks.every(isParagraphBlock);
