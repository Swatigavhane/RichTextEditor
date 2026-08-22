export type TextDiff = {
  start: number;
  deletedText: string;
  insertedText: string;
};

export const diffText = (beforeText: string, afterText: string): TextDiff => {
  let start = 0;

  while (
    start < beforeText.length &&
    start < afterText.length &&
    beforeText[start] === afterText[start]
  ) {
    start += 1;
  }

  let beforeEnd = beforeText.length;
  let afterEnd = afterText.length;

  while (
    beforeEnd > start &&
    afterEnd > start &&
    beforeText[beforeEnd - 1] === afterText[afterEnd - 1]
  ) {
    beforeEnd -= 1;
    afterEnd -= 1;
  }

  return {
    start,
    deletedText: beforeText.slice(start, beforeEnd),
    insertedText: afterText.slice(start, afterEnd),
  };
};
