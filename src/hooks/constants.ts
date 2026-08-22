import type { Mark } from '../model';

export const COMMON_MARKS = {
  bold: 'bold' as Mark,
  italic: 'italic' as Mark,
  link: {
    type: 'link',
    href: 'https://example.com',
  } as Mark,
} as const;
