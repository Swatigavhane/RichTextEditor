import type { Block, Mark, TextRun } from './index';
import { mergeAdjacentRuns, splitRunAt } from './runs';

export const splitBlock = (block: Block, offset: number): [Block, Block] => {
  const leftRuns: TextRun[] = [];
  const rightRuns: TextRun[] = [];
  let position = 0;

  for (const run of block.children) {
    const nextPosition = position + run.text.length;

    if (offset <= position) {
      rightRuns.push({ text: run.text, marks: [...run.marks] });
    } else if (offset >= nextPosition) {
      leftRuns.push({ text: run.text, marks: [...run.marks] });
    } else {
      const [leftRun, rightRun] = splitRunAt(run, offset - position);

      if (leftRun.text.length > 0) {
        leftRuns.push(leftRun);
      }

      if (rightRun.text.length > 0) {
        rightRuns.push(rightRun);
      }
    }

    position = nextPosition;
  }

  return [
    { type: block.type, id: `${block.id}-left`, children: mergeAdjacentRuns(leftRuns) },
    { type: block.type, id: `${block.id}-right`, children: mergeAdjacentRuns(rightRuns) },
  ];
};

export const mergeBlocks = (left: Block, right: Block): Block => ({
  type: left.type,
  id: left.id,
  children: mergeAdjacentRuns([
    ...left.children.map((run) => ({ text: run.text, marks: [...run.marks] as Mark[] })),
    ...right.children.map((run) => ({ text: run.text, marks: [...run.marks] as Mark[] })),
  ]),
});
