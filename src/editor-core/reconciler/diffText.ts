export type TextDiff = {
  start: number;
  deletedText: string;
  insertedText: string;
};

const findCommonPrefixLength = (beforeText: string, afterText: string): number => {
  let prefixLength = 0;

  while (
    prefixLength < beforeText.length &&
    prefixLength < afterText.length &&
    beforeText[prefixLength] === afterText[prefixLength]
  ) {
    prefixLength += 1;
  }

  return prefixLength;
};

const trimCommonSuffix = (
  beforeText: string,
  afterText: string,
  fromIndex: number,
): { beforeEnd: number; afterEnd: number } => {
  let beforeEnd = beforeText.length;
  let afterEnd = afterText.length;

  while (
    beforeEnd > fromIndex &&
    afterEnd > fromIndex &&
    beforeText[beforeEnd - 1] === afterText[afterEnd - 1]
  ) {
    beforeEnd -= 1;
    afterEnd -= 1;
  }

  return { beforeEnd, afterEnd };
};

// Calculates the smallest replacement needed to transform one text value into another.
export const diffText = (beforeText: string, afterText: string): TextDiff => {
  const start = findCommonPrefixLength(beforeText, afterText);
  const { beforeEnd, afterEnd } = trimCommonSuffix(beforeText, afterText, start);

  return {
    start,
    deletedText: beforeText.slice(start, beforeEnd),
    insertedText: afterText.slice(start, afterEnd),
  };
};
