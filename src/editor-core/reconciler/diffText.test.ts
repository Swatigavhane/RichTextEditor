import { describe, expect, it } from 'vitest';
import { diffText } from './diffText';

describe('text diff', () => {
    it('extracts the changed text segment', () => {
        expect(diffText('Hello world', 'Hello brave world')).toEqual({
            start: 6,
            deletedText: '',
            insertedText: 'brave ',
        });
    });
});