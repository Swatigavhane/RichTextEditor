import type { Mark } from '../model';

export type EditorCommandId = 'toggle-bold' | 'toggle-italic' | 'insert-link';

export type ToolbarCommandConfig = {
  id: EditorCommandId;
  label: string;
  mark: Mark;
  activeMark: 'bold' | 'italic' | 'link' | null;
};

export const COMMON_MARKS = {
  bold: 'bold' as Mark,
  italic: 'italic' as Mark,
  link: {
    type: 'link',
    href: 'https://example.com',
  } as Mark,
} as const;

export const TOOLBAR_COMMANDS: ToolbarCommandConfig[] = [
  {
    id: 'toggle-bold',
    label: 'Bold',
    mark: COMMON_MARKS.bold,
    activeMark: 'bold',
  },
  {
    id: 'toggle-italic',
    label: 'Italic',
    mark: COMMON_MARKS.italic,
    activeMark: 'italic',
  },
  {
    id: 'insert-link',
    label: 'Link',
    mark: COMMON_MARKS.link,
    activeMark: 'link',
  },
];
