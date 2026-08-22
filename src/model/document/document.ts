import type { DocumentModel, ParagraphBlock, InlineMark, TextSpan } from './document.types';

const EMPTY_SPAN: TextSpan = { text: '', marks: [] };

const cloneMarks = (marks: InlineMark[]): InlineMark[] =>
    marks.map((mark) => (typeof mark === 'string' ? mark : { ...mark }));

const cloneSpan = (span: TextSpan): TextSpan => ({
    text: span.text,
    marks: cloneMarks(span.marks),
});

const cloneBlock = (block: ParagraphBlock): ParagraphBlock => ({
    type: block.type,
    id: block.id,
    children: block.children.map(cloneSpan),
});

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const isInlineMarkType = (value: unknown): value is InlineMark => value === 'bold' || value === 'italic';

const isLinkMark = (value: unknown): value is InlineMark =>
    isObject(value) && value.type === 'link' && typeof value.href === 'string';

const isInlineMark = (value: unknown): value is InlineMark => isInlineMarkType(value) || isLinkMark(value);

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

const isDocumentModel = (value: unknown): value is DocumentModel =>
    isObject(value) && Array.isArray(value.blocks) && value.blocks.every(isParagraphBlock);

const normalizeSpans = (spans: TextSpan[]): TextSpan[] => {
    const normalizedSpans: TextSpan[] = [];

    for (const span of spans) {
        if (span.text.length === 0) {
            continue;
        }

        const previousSpan = normalizedSpans[normalizedSpans.length - 1];

        if (previousSpan && JSON.stringify(previousSpan.marks) === JSON.stringify(span.marks)) {
            previousSpan.text += span.text;
            continue;
        }

        normalizedSpans.push(cloneSpan(span));
    }

    return normalizedSpans.length > 0 ? normalizedSpans : [EMPTY_SPAN];
};

const normalizeBlock = (block: ParagraphBlock): ParagraphBlock => ({
    type: 'paragraph',
    id: block.id,
    children: normalizeSpans(block.children),
});

export const createParagraph = (id: string, text = ''): ParagraphBlock => ({
    type: 'paragraph',
    id,
    children: text.length > 0 ? [{ text, marks: [] }] : [EMPTY_SPAN],
});

export const createEmptyDocument = (): DocumentModel => ({
    blocks: [createParagraph('block-1')],
});

export const normalizeDocument = (documentModel: DocumentModel): DocumentModel => ({
    blocks:
        documentModel.blocks.length > 0 ? documentModel.blocks.map(normalizeBlock) : [createParagraph('block-1')],
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
    documentModel.blocks.map((block) => block.children.map((span) => span.text).join('')).join('\n');

export const cloneDocument = (documentModel: DocumentModel): DocumentModel => ({
    blocks: documentModel.blocks.map(cloneBlock),
});