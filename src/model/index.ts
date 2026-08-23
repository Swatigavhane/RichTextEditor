export type {
  InlineMarkType,
  LinkMark,
  InlineMark,
  TextSpan,
  ParagraphBlock,
  Block,
  DocumentModel,
  SelectionPoint,
  SelectionRange,
  LinearSelectionRange,
  MarkCoverage,
  Mark,
  Document,
  TextRun,
} from './types';

export {
  createParagraph,
  createEmptyDocument,
  normalizeDocument,
  serializeDocument,
  deserializeDocument,
  getBlockTextLength,
  getDocumentText,
  cloneDocument,
} from './document';

export { splitRunAt, mergeAdjacentRuns, normalizeRuns } from './runs';

export {
  getMarkCoverage,
  toggleInlineMark,
  applyInlineMark,
  clearInlineMark,
  getSelectionMarks,
  deleteSelectionRange,
  replaceSelectionWithText,
} from './marks';

export { splitBlock, mergeBlocks } from './blocks';
