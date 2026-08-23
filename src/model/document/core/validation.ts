// Runtime validators for safely reading serialized document payloads.
import type { DocumentModel, InlineMark, ParagraphBlock, TextSpan } from '../../types';

// Checks whether an unknown value is a non-null object.
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// Validates string-based inline mark values.
const isInlineMarkType = (value: unknown): value is InlineMark =>
  value === 'bold' || value === 'italic';

// Validates link mark objects.
const isLinkMark = (value: unknown): value is InlineMark =>
  isObject(value) && value.type === 'link' && typeof value.href === 'string';

// Validates any supported inline mark.
const isInlineMark = (value: unknown): value is InlineMark =>
  isInlineMarkType(value) || isLinkMark(value);

// Validates a text span and all of its marks.
const isTextSpan = (value: unknown): value is TextSpan =>
  isObject(value) &&
  typeof value.text === 'string' &&
  Array.isArray(value.marks) &&
  value.marks.every(isInlineMark);

// Validates a paragraph block and its child spans.
const isParagraphBlock = (value: unknown): value is ParagraphBlock =>
  isObject(value) &&
  value.type === 'paragraph' &&
  typeof value.id === 'string' &&
  Array.isArray(value.children) &&
  value.children.every(isTextSpan);

// Checks whether unknown input matches the document model schema.
export const isDocumentModel = (value: unknown): value is DocumentModel =>
  isObject(value) && Array.isArray(value.blocks) && value.blocks.every(isParagraphBlock);
