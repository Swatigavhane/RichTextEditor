import { describe, expect, it } from 'vitest';
import { createHistoryStack, pushHistoryEntry, redoHistory, undoHistory } from './historyStack';

describe('history stack', () => {
  it('supports push, undo, and redo', () => {
    const initial = createHistoryStack('A');
    const pushed = pushHistoryEntry(initial, {
      state: 'B',
      timestamp: initial.present.timestamp + 10,
    });
    const undone = undoHistory(pushed);
    const redone = redoHistory(undone);

    expect(pushed.present.state).toBe('B');
    expect(undone.present.state).toBe('A');
    expect(redone.present.state).toBe('B');
  });
});
