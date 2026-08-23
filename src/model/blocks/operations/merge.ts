// Merge logic for joining adjacent blocks into a single block.
import type { Block } from '../../types';
import { mergeAdjacentRuns } from '../../runs';
import { cloneSpan } from '../utils/shared';

// Joins two adjacent blocks while preserving their inline marks.
export const mergeBlocks = (left: Block, right: Block): Block => ({
  type: left.type,
  id: left.id,
  children: mergeAdjacentRuns([...left.children.map(cloneSpan), ...right.children.map(cloneSpan)]),
});
