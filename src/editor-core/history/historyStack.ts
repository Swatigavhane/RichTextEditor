export type HistoryEntry<TState> = {
  state: TState;
  selection?: unknown;
  groupId?: string;
  timestamp: number;
};

export type HistoryStack<TState> = {
  past: HistoryEntry<TState>[];
  present: HistoryEntry<TState>;
  future: HistoryEntry<TState>[];
};

export const createHistoryStack = <TState>(initialState: TState): HistoryStack<TState> => ({
  past: [],
  present: { state: initialState, timestamp: Date.now() },
  future: [],
});

export const pushHistoryEntry = <TState>(
  stack: HistoryStack<TState>,
  nextEntry: HistoryEntry<TState>,
  coalesceWindowMs = 400,
): HistoryStack<TState> => {
  const shouldCoalesce = Boolean(
    stack.present.groupId &&
    nextEntry.groupId &&
    stack.present.groupId === nextEntry.groupId &&
    nextEntry.timestamp - stack.present.timestamp <= coalesceWindowMs,
  );

  if (shouldCoalesce) {
    return {
      past: stack.past,
      present: nextEntry,
      future: [],
    };
  }

  return {
    past: [...stack.past, stack.present],
    present: nextEntry,
    future: [],
  };
};

export const undoHistory = <TState>(stack: HistoryStack<TState>): HistoryStack<TState> => {
  if (stack.past.length === 0) {
    return stack;
  }

  const previous = stack.past[stack.past.length - 1];

  return {
    past: stack.past.slice(0, -1),
    present: previous,
    future: [stack.present, ...stack.future],
  };
};

export const redoHistory = <TState>(stack: HistoryStack<TState>): HistoryStack<TState> => {
  if (stack.future.length === 0) {
    return stack;
  }

  const [next, ...future] = stack.future;

  return {
    past: [...stack.past, stack.present],
    present: next,
    future,
  };
};
