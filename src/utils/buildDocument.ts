import { createEmptyDocument, createParagraph } from '../model';

// Builds a document from an optional list of block text values.
export const buildDocument = (blocks?: string[]) => {
  if (!blocks || blocks.length === 0) {
    return createEmptyDocument();
  }

  return {
    blocks: blocks.map((text, index) => createParagraph(`block-${index + 1}`, text)),
  };
};
