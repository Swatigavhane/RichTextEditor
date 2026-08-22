import { createEmptyDocument, createParagraph } from '../model';

export const buildDocument = (blocks?: string[]) => {
    if (!blocks || blocks.length === 0) {
        return createEmptyDocument();
    }

    return {
        blocks: blocks.map((text, index) => createParagraph(`block-${index + 1}`, text)),
    };
};