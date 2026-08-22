import { describe, expect, it } from 'vitest';
import { mergeAdjacentRuns, normalizeRuns, splitRunAt } from './runs';

describe('run helpers', () => {
    it('splits a run at an offset', () => {
        expect(splitRunAt({ text: 'Hello', marks: ['bold'] }, 2)).toEqual([
            { text: 'He', marks: ['bold'] },
            { text: 'llo', marks: ['bold'] },
        ]);
    });

    it('merges adjacent runs with the same marks', () => {
        expect(
            mergeAdjacentRuns([
                { text: 'He', marks: [] },
                { text: 'llo', marks: [] },
                { text: ' ', marks: ['bold'] },
                { text: 'world', marks: ['bold'] },
            ]),
        ).toEqual([
            { text: 'Hello', marks: [] },
            { text: ' world', marks: ['bold'] },
        ]);
    });

    it('normalizes empty runs away', () => {
        expect(normalizeRuns([{ text: '', marks: [] }, { text: 'A', marks: [] }])).toEqual([
            { text: 'A', marks: [] },
        ]);
    });
});