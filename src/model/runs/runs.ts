import type { Mark, TextRun } from '../types';

// Creates a comparable string representation for an inline mark.
const markSignature = (mark: Mark): string =>
  typeof mark === 'string' ? mark : `${mark.type}:${mark.href}`;

// Checks whether two mark arrays contain the same marks in the same order.
const sameMarks = (left: Mark[], right: Mark[]): boolean =>
  left.length === right.length &&
  left.every((mark, index) => markSignature(mark) === markSignature(right[index]));

// Splits a text run while copying its formatting marks to both pieces.
export const splitRunAt = (run: TextRun, offset: number): [TextRun, TextRun] => [
  { text: run.text.slice(0, offset), marks: [...run.marks] },
  { text: run.text.slice(offset), marks: [...run.marks] },
];

// Merges neighboring runs that have identical marks.
export const mergeAdjacentRuns = (runs: TextRun[]): TextRun[] => {
  const mergedRuns: TextRun[] = [];

  for (const run of runs) {
    if (run.text.length === 0) {
      continue;
    }

    const previousRun = mergedRuns[mergedRuns.length - 1];

    if (previousRun && sameMarks(previousRun.marks, run.marks)) {
      previousRun.text += run.text;
      continue;
    }

    mergedRuns.push({ text: run.text, marks: [...run.marks] });
  }

  return mergedRuns;
};

// Canonicalizes a run collection by merging compatible neighbors.
/** Normalizes a run list by removing empty runs and merging compatible neighbors. */
export const normalizeRuns = (runs: TextRun[]): TextRun[] => mergeAdjacentRuns(runs);
